# WinterArc daily engine: the hub, a day's content, and answering a question.
# Needs migration 009_winterarc_engine.sql. Rules: services/winterarc_rules.py.
#
# The 30 days are the modules of a DRAFT course (settings.WINTERARC_COURSE_SLUG),
# so the normal course pages never show them to learners. Day n = the module
# with order_index n. It opens to learners at midnight IST on n Dec, and only
# once an admin has published the module. Only signed-in people on the
# WinterArc list can open a day. Answers are marked here, never in the browser:
# a question's answer key and explanation are sent only once it is finished.
# Streak bonuses and extra resets are written to winterarc_points (once each,
# by `ref`) whenever an answer or a reset could have earned one.
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.config import settings
from app.dependencies import AuthUser, get_current_user, require_admin
from app.integrations.supabase_client import supabase
from app.models.card_data import quiz_is_right
from app.services import winterarc_rules as R
from app.services.course_visibility import is_admin, is_released
from app.routes.winterarc import canonical_email

router = APIRouter(prefix="/winterarc", tags=["WinterArc"])

ANSWERS = "winterarc_answers"
POINTS = "winterarc_points"
WAITLIST = "winterarc_waitlist"


def _now() -> datetime:
    """The current time (replaced in tests)."""
    return datetime.now(timezone.utc)


class AnswerRequest(BaseModel):
    card_id: str = Field(max_length=64)
    answer: str = Field(min_length=1, max_length=500)


class ResetRequest(BaseModel):
    day: int


# --- Lookups ---------------------------------------------------------------

def _email(user: AuthUser) -> str:
    return (user.email or "").strip().lower()


def _joined(email: str) -> bool:
    """On the WinterArc list (any spelling of the same inbox) and not disqualified."""
    res = supabase.from_(WAITLIST).select("id, disqualified_at").eq("email_canonical", canonical_email(email)).limit(1).execute()
    if not (res and res.data):
        res = supabase.from_(WAITLIST).select("id, disqualified_at").ilike("email", email).limit(1).execute()
    return bool(res and res.data) and not res.data[0].get("disqualified_at")


def _course() -> Optional[dict]:
    res = supabase.from_("courses").select("id, slug").eq("slug", settings.WINTERARC_COURSE_SLUG).limit(1).execute()
    return res.data[0] if res and res.data else None


def _modules(course_id: str) -> dict:
    """Day number -> module row."""
    res = supabase.from_("modules").select("id, title, slug, order_index, status").eq("course_id", course_id).execute()
    return {m["order_index"]: m for m in (res.data or []) if R.valid_day(m.get("order_index"))}


def _cards(module_id: str) -> list:
    res = supabase.from_("cards").select("*").eq("module_id", module_id).order("order_index").execute()
    return res.data or []


def _question_counts(module_ids: list) -> dict:
    """Module id -> number of questions, for the given modules (one query)."""
    if not module_ids:
        return {}
    res = supabase.from_("cards").select("module_id, card_template").in_("module_id", module_ids).execute()
    counts = {}
    for c in res.data or []:
        if R.is_quiz(c):
            counts[c["module_id"]] = counts.get(c["module_id"], 0) + 1
    return counts


def _my_answers(email: str) -> list:
    res = supabase.from_(ANSWERS).select("*").eq("email", email).execute()
    return res.data or []


def _my_points(email: str) -> list:
    res = supabase.from_(POINTS).select("kind, points, week_no, day_no, ref, created_at").eq("email", email).execute()
    return res.data or []


def _when(value) -> Optional[datetime]:
    return datetime.fromisoformat(value) if value else None


def _my_referrals(email: str, extra: list) -> dict:
    """My invite code and how my referrals stand (joined / counted / pending)."""
    res = supabase.from_(WAITLIST).select("referral_code").eq("email_canonical", canonical_email(email)).limit(1).execute()
    if not (res and res.data):
        res = supabase.from_(WAITLIST).select("referral_code").ilike("email", email).limit(1).execute()
    code = res.data[0].get("referral_code") if res and res.data else None
    joined = 0
    if code:
        joined = len(supabase.from_(WAITLIST).select("id").eq("referred_by_code", code).execute().data or [])
    counted = sum(1 for p in extra if p.get("kind") == "referral")
    rejected = sum(1 for p in extra if p.get("kind") == "referral_rejected")
    return {"code": code, "joined": joined, "counted": counted, "pending": max(0, joined - counted - rejected),
            "points_each": 10, "cap": 20}


def _repaired(extra: list) -> dict:
    """Day -> when a reset was spent on it."""
    return {p["day_no"]: _when(p["created_at"]) for p in extra if p.get("kind") == "reset_used" and p.get("day_no")}


def _progress(email: str, now: datetime) -> dict:
    """Everything the hub and the reward rules need about one person."""
    course = _course()
    modules = _modules(course["id"]) if course else {}
    open_days = {n: m for n, m in modules.items() if _day_open(m, n, now)}
    totals = _question_counts([m["id"] for m in open_days.values()])
    answers = _my_answers(email)
    extra = _my_points(email)
    repaired = _repaired(extra)

    by_day = {}
    for a in answers:
        by_day.setdefault(a["day_no"], []).append(a)
    days = {}
    for n, module in open_days.items():
        rows = by_day.get(n, [])
        total = totals.get(module["id"], 0)
        done = [a for a in rows if a.get("finished")]
        days[n] = {
            "opened": total > 0,
            "done_at": max(_when(a["finished_at"]) for a in done) if total and len(done) >= total else None,
            "reset_at": repaired.get(n),
        }
    return {"open_days": open_days, "totals": totals, "answers": answers, "by_day": by_day,
            "extra": extra, "repaired": repaired, "days": days}


def _award(email: str, kind: str, ref: str, points: int, at: datetime, now: datetime, day_no=None, reason=None):
    """Write one award (once per ref; a second write is refused by the index).
    It never lands in a week that has already closed."""
    week = R.week_at(at)
    if now >= R.week_closes(week):
        week = R.week_at(now)
    try:
        supabase.from_(POINTS).insert([{
            "email": email, "kind": kind, "ref": ref, "points": points, "week_no": week,
            "day_no": day_no, "reason": reason, "created_by": "winterarc", "created_at": at.isoformat(),
        }]).execute()
    except Exception:
        pass  # already awarded


def _sync_rewards(email: str, progress: dict, now: datetime) -> bool:
    """Write any streak bonus or extra reset this person has earned and not
    yet been given. Returns True if anything new was written."""
    have = {(p["kind"], p.get("ref")) for p in progress["extra"]}
    states = R.day_states(progress["days"], now)
    new = False
    for b in R.streak_bonuses(R.streak_runs(states)):
        if ("streak_bonus", b["ref"]) not in have:
            _award(email, "streak_bonus", b["ref"], b["points"], b["at"], now, reason=f"{b['length']}-day streak")
            new = True
    for w in R.weeks_fully_done(progress["days"], now):
        ref = f"reset_earned:{w}"
        if ("reset_earned", ref) not in have:
            _award(email, "reset_earned", ref, 0, R.week_closes(w) - timedelta(seconds=1), now, reason=f"Finished every task in week {w}")
            new = True
    return new


def _day_open(module: Optional[dict], day: int, now: datetime) -> bool:
    return bool(module) and is_released(module) and R.is_open(day, now)


def _require_member(user: AuthUser, email: str):
    if not is_admin(user) and not _joined(email):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Join WinterArc to open the challenge.")


def _day_module(day: int, user: AuthUser, now: datetime) -> dict:
    """The module for this day, if this person may open it (else 404/423)."""
    if not R.valid_day(day):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "There is no such day.")
    course = _course()
    module = _modules(course["id"]).get(day) if course else None
    if is_admin(user) and module:
        return module
    if not _day_open(module, day, now):
        raise HTTPException(status.HTTP_423_LOCKED, f"Day {day} opens at {R.opens_at(day).isoformat()}.")
    return module


def _question_state(row: Optional[dict], day: int, now: datetime, repaired: bool = False) -> dict:
    tries = (row or {}).get("tries") or 0
    finished = bool((row or {}).get("finished"))
    return {
        "tries": tries,
        "tries_left": 0 if finished else R.MAX_TRIES - tries,
        "finished": finished,
        "right": bool((row or {}).get("is_correct")),
        "points": (row or {}).get("points") or 0,
        "on_offer": 0 if finished else R.points_on_offer(tries, day, now, repaired),
        # The last wrong answer (only the last is stored), so it stays greyed out
        "tried": [row["last_answer"]] if row and tries and not finished and row.get("last_answer") else [],
    }


def _package(card: dict, row: Optional[dict]) -> dict:
    """A card as the day page receives it: quiz answers hidden until finished."""
    out = {**card, "status": "incompleted", "userAnswer": None}
    if R.is_quiz(card):
        if row and row.get("finished"):
            out.update(status="completed", userAnswer=row.get("last_answer"))
        else:
            out["card_data"] = R.hide_answer(card.get("card_data") or {})
    return out


# --- Routes ----------------------------------------------------------------

@router.get("/me")
async def my_challenge(user: AuthUser = Depends(get_current_user)):
    """The hub: which days are open, how each went, and the score so far."""
    email = _email(user)
    now = _now()
    joined = await asyncio.to_thread(_joined, email)
    if not joined and not is_admin(user):
        return {"joined": False, "starts_at": R.start().isoformat()}

    progress = await asyncio.to_thread(_progress, email, now)
    if await asyncio.to_thread(_sync_rewards, email, progress, now):
        progress["extra"] = await asyncio.to_thread(_my_points, email)
    open_days, totals, answers = progress["open_days"], progress["totals"], progress["answers"]
    by_day, extra = progress["by_day"], progress["extra"]
    states = R.day_states(progress["days"], now)
    state_of = {n: st for n, st, _ in states}

    days = []
    for n in range(1, R.TOTAL_DAYS + 1):
        rows = by_day.get(n, [])
        finished = sum(1 for a in rows if a.get("finished"))
        module = open_days.get(n)
        days.append({
            "day": n,
            "opens_at": R.opens_at(n).isoformat(),
            "open": module is not None,
            "title": module.get("title") if module else None,
            "questions": totals.get(module["id"], 0) if module else 0,
            "finished_questions": finished,
            "status": R.day_status(finished, totals.get(module["id"], 0) if module else 0),
            "points": sum(a.get("points") or 0 for a in rows),
            "streak": state_of.get(n),
            "repaired": n in progress["repaired"],
        })

    weeks = {w: 0 for w, _, _ in R.WEEKS}
    for a in answers:
        weeks[a["week_no"]] = weeks.get(a["week_no"], 0) + (a.get("points") or 0)
    for p in extra:
        weeks[p["week_no"]] = weeks.get(p["week_no"], 0) + (p.get("points") or 0)

    today = next((d["day"] for d in reversed(days) if d["open"]), None)
    earned = sum(1 for p in extra if p.get("kind") == "reset_earned")
    used = sum(1 for p in extra if p.get("kind") == "reset_used")
    bonuses = sorted(
        ({"points": p["points"], "reason": p.get("ref"), "week": p["week_no"]} for p in extra if p.get("kind") == "streak_bonus"),
        key=lambda b: b["reason"] or "",
    )
    referrals = await asyncio.to_thread(_my_referrals, email, extra)
    return {
        "joined": True,
        "referrals": referrals,
        "starts_at": R.start().isoformat(),
        "now": now.isoformat(),
        "today": today,
        "days": days,
        "total_points": sum(weeks.values()),
        "week_points": weeks,
        "streak": {
            "current": R.current_streak(states),
            "best": R.best_streak(states),
            "next_bonus": next(({"days": d, "points": p} for d, p in R.STREAK_BONUSES if d > R.current_streak(states)), None),
            "bonuses": bonuses,
        },
        "resets": {
            "left": R.resets_left(earned, used, now),
            "earned": earned,
            "used": used,
            "missed_days": R.repairable_days(states),
        },
    }


@router.get("/days/{day}")
async def open_day(day: int, user: AuthUser = Depends(get_current_user)):
    """One day's module, with each question's state. Members only."""
    email = _email(user)
    now = _now()
    await asyncio.to_thread(_require_member, user, email)
    module = await asyncio.to_thread(_day_module, day, user, now)
    cards, answers = await asyncio.gather(
        asyncio.to_thread(_cards, module["id"]),
        asyncio.to_thread(_my_answers, email),
    )
    rows = {a["card_id"]: a for a in answers if a.get("module_id") == module["id"]}
    extra = await asyncio.to_thread(_my_points, email)
    repaired = day in _repaired(extra)
    questions = {c["card_id"]: _question_state(rows.get(c["card_id"]), day, now, repaired) for c in cards if R.is_quiz(c)}
    action = _day_action(cards)
    return {
        "day": day,
        "module_id": module["id"],
        "module_title": module.get("title"),
        "module_order_index": day,
        "course_slug": None,
        "opens_at": R.opens_at(day).isoformat(),
        "cards": [_package(c, rows.get(c["card_id"])) for c in cards],
        "questions": questions,
        "action": {
            "text": action,
            "done": any(p.get("kind") == "action_done" and p.get("ref") == f"action:{day}" for p in extra),
        } if action else None,
        "preview": not _day_open(module, day, now),
    }


def _day_action(cards: list) -> Optional[str]:
    """The day's optional real-life action, from its completion card."""
    for c in cards:
        cd = c.get("card_data") or {}
        if (c.get("card_template") or cd.get("card_type")) == "completion" and (cd.get("winterarc_action") or "").strip():
            return cd["winterarc_action"].strip()
    return None


class ActionRequest(BaseModel):
    done: bool


@router.post("/days/{day}/action")
async def tick_action(day: int, body: ActionRequest, user: AuthUser = Depends(get_current_user)):
    """Tick (or untick) "I did this" on the day's optional action. No points."""
    email = _email(user)
    now = _now()
    await asyncio.to_thread(_require_member, user, email)
    module = await asyncio.to_thread(_day_module, day, user, now)
    cards = await asyncio.to_thread(_cards, module["id"])
    if not _day_action(cards):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This day has no action.")
    ref = f"action:{day}"
    if body.done:
        try:
            await asyncio.to_thread(lambda: supabase.from_(POINTS).insert([{
                "email": email, "kind": "action_done", "ref": ref, "points": 0, "week_no": R.week_at(now),
                "day_no": day, "reason": f"Did Day {day}'s action", "created_by": "winterarc", "created_at": now.isoformat(),
            }]).execute())
        except Exception:
            pass  # already ticked
    else:
        await asyncio.to_thread(lambda: supabase.from_(POINTS).delete()
                                .eq("email", email).eq("kind", "action_done").eq("ref", ref).execute())
    return {"ok": True, "done": body.done}


def _get_row(email: str, card_id: str) -> Optional[dict]:
    res = supabase.from_(ANSWERS).select("*").eq("email", email).eq("card_id", card_id).limit(1).execute()
    return res.data[0] if res and res.data else None


@router.post("/days/{day}/answer")
async def answer_question(day: int, body: AnswerRequest, user: AuthUser = Depends(get_current_user)):
    """Mark one try at a question. A question finishes on a right answer or
    on its last try; only then are the answer key and explanation sent."""
    email = _email(user)
    now = _now()
    await asyncio.to_thread(_require_member, user, email)
    module = await asyncio.to_thread(_day_module, day, user, now)
    cards = await asyncio.to_thread(_cards, module["id"])
    card = next((c for c in cards if c["card_id"] == body.card_id and R.is_quiz(c)), None)
    if not card:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found.")
    answer = body.answer.strip()
    if not R.answer_fits(card.get("card_data") or {}, answer):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That answer doesn't fit this question. Please try again.")
    right = quiz_is_right(card.get("card_data") or {}, answer)
    repaired = day in _repaired(await asyncio.to_thread(_my_points, email))

    # Two taps at once must not both count: each try only lands if nobody
    # else changed the row since it was read; otherwise read again.
    for _ in range(4):
        row = await asyncio.to_thread(_get_row, email, card["card_id"])
        if row and row.get("finished"):
            raise HTTPException(status.HTTP_409_CONFLICT, "This question is already finished.")
        tries = (row or {}).get("tries", 0) + 1
        finished = R.is_finished(tries, right)
        points = R.points_for(tries, right, day, now, repaired) if finished else 0
        stamp = now.isoformat()
        change = {
            "tries": tries,
            "last_answer": answer,
            "is_correct": right,
            "finished": finished,
            "points": points,
            "finished_at": stamp if finished else None,
            "updated_at": stamp,
        }
        if finished:
            change["week_no"] = R.answer_week(day, now, repaired)
            change["on_time"] = R.on_time(day, now)
        try:
            if row is None:
                res = await asyncio.to_thread(lambda: supabase.from_(ANSWERS).insert([{
                    "email": email,
                    "card_id": card["card_id"],
                    "module_id": module["id"],
                    "day_no": day,
                    "week_no": R.week_of(day),
                    "first_try_at": stamp,
                    **change,
                }]).execute())
            else:
                res = await asyncio.to_thread(lambda: supabase.from_(ANSWERS).update(change)
                                              .eq("id", row["id"]).eq("tries", row["tries"]).execute())
        except Exception:
            continue  # someone else's first try landed first
        if not (res and res.data):
            continue  # someone else's try landed first
        saved = res.data[0]
        out = {"right": right, **_question_state(saved, day, now, repaired)}
        if finished:
            out["card_data"] = card.get("card_data")
            out["answer"] = answer
            # Finishing a day can complete a streak bonus or a full week
            progress = await asyncio.to_thread(_progress, email, now)
            await asyncio.to_thread(_sync_rewards, email, progress, now)
        return out
    raise HTTPException(status.HTTP_409_CONFLICT, "Please try again.")


@router.post("/resets")
async def use_reset(body: ResetRequest, user: AuthUser = Depends(get_current_user)):
    """Spend a reset on a missed day: its streak counts again, and its task can
    be done for half points until the end of Day 30."""
    email = _email(user)
    now = _now()
    await asyncio.to_thread(_require_member, user, email)
    progress = await asyncio.to_thread(_progress, email, now)
    states = R.day_states(progress["days"], now)
    if body.day not in R.repairable_days(states):
        raise HTTPException(status.HTTP_409_CONFLICT, "That day doesn't need a reset.")
    extra = progress["extra"]
    earned = sum(1 for p in extra if p.get("kind") == "reset_earned")
    used = sum(1 for p in extra if p.get("kind") == "reset_used")
    if R.resets_left(earned, used, now) <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have no resets left.")
    try:
        await asyncio.to_thread(lambda: supabase.from_(POINTS).insert([{
            "email": email, "kind": "reset_used", "ref": f"reset_used:{body.day}", "points": 0,
            "week_no": R.week_at(now), "day_no": body.day, "reason": f"Reset spent on Day {body.day}",
            "created_by": "winterarc", "created_at": now.isoformat(),
        }]).execute())
    except Exception:
        raise HTTPException(status.HTTP_409_CONFLICT, "A reset was already spent on that day.")
    progress = await asyncio.to_thread(_progress, email, now)
    await asyncio.to_thread(_sync_rewards, email, progress, now)
    return {"ok": True, "day": body.day, "resets_left": R.resets_left(earned, used + 1, now)}


BOARD_SIZE = 50


@router.get("/leaderboard")
async def leaderboard(week: Optional[int] = None, user: AuthUser = Depends(get_current_user)):
    """A weekly board (week=1..5) or the final board (no week): the top 50
    and the viewer's own row. Members only; names are first name + initial."""
    email = _email(user)
    await asyncio.to_thread(_require_member, user, email)
    if week is not None and week not in [w for w, _, _ in R.WEEKS]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "There is no such week.")
    view = "winterarc_board_week" if week else "winterarc_board_final"
    cols = "email, display_name, points, on_time_days, rank"

    def top():
        q = supabase.from_(view).select(cols)
        if week:
            q = q.eq("week_no", week)
        return q.order("rank").order("reached_at").limit(BOARD_SIZE).execute().data or []

    def mine():
        q = supabase.from_(view).select(cols).eq("email", email)
        if week:
            q = q.eq("week_no", week)
        res = q.limit(1).execute().data
        return res[0] if res else None

    rows, me = await asyncio.gather(asyncio.to_thread(top), asyncio.to_thread(mine))
    strip = lambda r: {"name": r["display_name"], "points": r["points"], "on_time_days": r["on_time_days"],
                       "rank": r["rank"], "me": r["email"] == email}
    now = _now()
    return {
        "week": week,
        "closed": now >= (R.week_closes(week) if week else R.ends_at()),
        "rows": [strip(r) for r in rows],
        "me": strip(me) if me else None,
    }


# --- Admin: the 30-day calendar --------------------------------------------

@router.get("/admin/calendar")
async def admin_calendar(user: AuthUser = Depends(require_admin)):
    """Each day: its module, open time, release status, and anything missing."""
    course = await asyncio.to_thread(_course)
    if not course:
        return {"course": None, "course_slug": settings.WINTERARC_COURSE_SLUG, "days": []}
    modules = await asyncio.to_thread(_modules, course["id"])
    now = _now()

    async def one(n: int) -> dict:
        module = modules.get(n)
        info = {
            "day": n,
            "week": R.week_of(n),
            "opens_at": R.opens_at(n).isoformat(),
            "module": None,
            "released": False,
            "open_now": False,
            "problems": [],
        }
        if not module:
            info["problems"].append("No module for this day yet.")
            return info
        cards = await asyncio.to_thread(_cards, module["id"])
        quizzes = [c for c in cards if R.is_quiz(c)]
        info.update(
            module={"id": module["id"], "title": module.get("title"), "slug": module.get("slug")},
            released=is_released(module),
            open_now=_day_open(module, n, now),
            questions=len(quizzes),
        )
        if n != R.FINALE_DAY and len(quizzes) != R.QUESTIONS_PER_DAY:
            info["problems"].append(f"Has {len(quizzes)} questions; each day needs {R.QUESTIONS_PER_DAY}.")
        if n == R.FINALE_DAY and not quizzes:
            info["problems"].append("The finale has no questions.")
        for i, q in enumerate(quizzes, 1):
            if not ((q.get("card_data") or {}).get("explanation") or "").strip():
                info["problems"].append(f"Question {i} has no explanation.")
        if not is_released(module) and R.is_open(n, now):
            info["problems"].append("The day has started but the module isn't published.")
        return info

    days = await asyncio.gather(*(one(n) for n in range(1, R.TOTAL_DAYS + 1)))
    return {"course": {"id": course["id"], "slug": course["slug"]}, "days": days}
