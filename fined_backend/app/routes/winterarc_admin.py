# WinterArc admin tools (needs migrations 008-012). Admins only.
#
#   Referral checks  every referral, its status and fraud flags; approve
#                    (+10 to the referrer, at most 20) or reject. A referral
#                    can be approved once the friend has finished Day 3.
#   People           search the list; one person's points, days, resets,
#                    friends and history; grant or take back points (with a
#                    reason), gift a reset, disqualify or reinstate.
#   Winners          each board's top 10 with what's needed to verify them.
#
# Nothing is deleted except a rejection being undone (it carries 0 points).
# Awards land in the current week, never in one that has closed.
import asyncio
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies import AuthUser, require_admin
from app.integrations.supabase_client import supabase
from app.routes import winterarc_days as days_api
from app.routes.winterarc import canonical_email
from app.services import winterarc_rules as R

router = APIRouter(prefix="/winterarc/admin", tags=["WinterArc"])

WAITLIST = "winterarc_waitlist"
POINTS = "winterarc_points"
ANSWERS = "winterarc_answers"
PAGE = 1000

REFERRAL_POINTS = 10
REFERRAL_CAP = 20
REFERRAL_DAY = 3
BURST_COUNT = 5
BURST_WINDOW = timedelta(hours=1)
# Common throwaway-inbox domains (not complete; the manual check is the backstop)
DISPOSABLE = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org",
    "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com",
    "maildrop.cc", "fakeinbox.com", "throwawaymail.com", "mintemail.com", "emailondeck.com",
}
WAITLIST_COLUMNS = ("id, email, email_canonical, name, college, referral_code, referred_by_code, "
                    "created_at, disqualified_at, disqualified_reason")


class DecideRequest(BaseModel):
    friend_id: str = Field(max_length=64)
    decision: str = Field(pattern="^(approve|reject|undo)$")
    reason: Optional[str] = Field(default=None, max_length=300)


class GrantRequest(BaseModel):
    points: int = Field(ge=-500, le=500)
    reason: str = Field(min_length=3, max_length=300)


class ReasonRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=300)


# --- Lookups -----------------------------------------------------------------

def _all(table: str, columns: str, **eq) -> list:
    rows, start = [], 0
    while True:
        q = supabase.from_(table).select(columns)
        for k, v in eq.items():
            q = q.eq(k, v)
        batch = q.range(start, start + PAGE - 1).execute().data or []
        rows.extend(batch)
        if len(batch) < PAGE:
            return rows
        start += PAGE


def _when(v) -> Optional[datetime]:
    return datetime.fromisoformat(v) if v else None


def _canon(row: dict) -> str:
    return row.get("email_canonical") or canonical_email(row.get("email"))


def _day_done_emails(day: int, emails: list) -> set:
    """Which of these people have finished every question of `day`."""
    course = days_api._course()
    module = days_api._modules(course["id"]).get(day) if course else None
    if not module or not emails:
        return set()
    total = days_api._question_counts([module["id"]]).get(module["id"], 0)
    if not total:
        return set()
    done = {}
    for i in range(0, len(emails), 200):
        res = supabase.from_(ANSWERS).select("email").eq("module_id", module["id"]).eq("finished", True).in_("email", emails[i:i + 200]).execute()
        for r in res.data or []:
            done[r["email"]] = done.get(r["email"], 0) + 1
    return {e for e, n in done.items() if n >= total}


def referral_flags(friend: dict, owner: Optional[dict], same_code: list, inbox_count: dict, owner_approved: int) -> list:
    """Reasons to look closely at a referral (none of them blocks it)."""
    flags = []
    if not owner:
        return ["The referral code belongs to nobody on the list."]
    if _canon(friend) == _canon(owner):
        flags.append("Same inbox as the referrer.")
    name = lambda r: re.sub(r"\s+", " ", (r.get("name") or "").strip().lower())
    college = lambda r: (r.get("college") or "").strip().lower()
    if name(friend) and name(friend) == name(owner) and college(friend) and college(friend) == college(owner):
        flags.append("Same name and college as the referrer.")
    if _canon(friend).split("@")[-1] in DISPOSABLE:
        flags.append("Throwaway email address.")
    if inbox_count.get(_canon(friend), 0) > 1:
        flags.append("Another sign-up uses the same inbox.")
    at = _when(friend.get("created_at"))
    if at:
        near = sum(1 for f in same_code if (t := _when(f.get("created_at"))) and abs(t - at) <= BURST_WINDOW)
        if near >= BURST_COUNT:
            flags.append(f"{near} sign-ups on this code within an hour of each other.")
    if owner_approved >= REFERRAL_CAP:
        flags.append(f"The referrer already has {REFERRAL_CAP} approved referrals (the cap).")
    if owner.get("disqualified_at"):
        flags.append("The referrer is disqualified.")
    if friend.get("disqualified_at"):
        flags.append("This friend is disqualified.")
    return flags


def build_referrals(rows: list, decisions: list, day3_done: set) -> list:
    """Every referral on the list with its status and flags, newest first."""
    by_code = {r["referral_code"]: r for r in rows if r.get("referral_code")}
    inbox_count = {}
    for r in rows:
        inbox_count[_canon(r)] = inbox_count.get(_canon(r), 0) + 1
    friends_of = {}
    for r in rows:
        if r.get("referred_by_code"):
            friends_of.setdefault(r["referred_by_code"], []).append(r)
    decided = {}
    approved = {}
    for d in decisions:
        decided[d["ref"]] = d
        if d["kind"] == "referral":
            approved[d["email"].lower()] = approved.get(d["email"].lower(), 0) + 1

    out = []
    for code, friends in friends_of.items():
        owner = by_code.get(code)
        for f in friends:
            ref = f"referral:{_canon(f)}"
            d = decided.get(ref)
            if d:
                state = "approved" if d["kind"] == "referral" else "rejected"
            else:
                state = "ready" if f["email"].lower() in day3_done else "waiting"
            out.append({
                "friend_id": f["id"],
                "friend_name": f.get("name"),
                "friend_email": f["email"],
                "friend_college": f.get("college"),
                "joined_at": f.get("created_at"),
                "code": code,
                "referrer_id": owner["id"] if owner else None,
                "referrer_name": owner.get("name") if owner else None,
                "referrer_email": owner["email"] if owner else None,
                "status": state,
                "decided_reason": d.get("reason") if d else None,
                "flags": referral_flags(f, owner, friends, inbox_count, approved.get((owner or {}).get("email", "").lower(), 0)),
            })
    out.sort(key=lambda r: r["joined_at"] or "", reverse=True)
    return out


def _person(person_id: str) -> dict:
    res = supabase.from_(WAITLIST).select(WAITLIST_COLUMNS).eq("id", person_id).limit(1).execute()
    if not (res and res.data):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nobody with that id on the list.")
    return res.data[0]


def _write_points(email: str, kind: str, points: int, reason: str, admin: AuthUser, ref: Optional[str] = None, day_no=None):
    now = days_api._now()
    supabase.from_(POINTS).insert([{
        "email": email.lower(), "kind": kind, "points": points, "week_no": R.week_at(now),
        "day_no": day_no, "reason": reason, "created_by": admin.email,
        "ref": ref or f"{kind}:{uuid.uuid4()}", "created_at": now.isoformat(),
    }]).execute()


# --- Referral checks ---------------------------------------------------------

@router.get("/referrals")
async def list_referrals(user: AuthUser = Depends(require_admin)):
    rows, decisions = await asyncio.gather(
        asyncio.to_thread(_all, WAITLIST, WAITLIST_COLUMNS),
        asyncio.to_thread(lambda: _all(POINTS, "email, kind, ref, reason, created_at", kind="referral")
                          + _all(POINTS, "email, kind, ref, reason, created_at", kind="referral_rejected")),
    )
    friend_emails = [r["email"].lower() for r in rows if r.get("referred_by_code")]
    day3 = await asyncio.to_thread(_day_done_emails, REFERRAL_DAY, friend_emails)
    referrals = build_referrals(rows, decisions, day3)
    counts = {}
    for r in referrals:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    return {"counts": counts, "referrals": referrals, "points": REFERRAL_POINTS, "cap": REFERRAL_CAP}


@router.post("/referrals/decide")
async def decide_referral(body: DecideRequest, user: AuthUser = Depends(require_admin)):
    friend = await asyncio.to_thread(_person, body.friend_id)
    code = friend.get("referred_by_code")
    if not code:
        raise HTTPException(status.HTTP_409_CONFLICT, "This person wasn't referred.")
    owner_res = await asyncio.to_thread(lambda: supabase.from_(WAITLIST).select(WAITLIST_COLUMNS).eq("referral_code", code).limit(1).execute())
    owner = owner_res.data[0] if owner_res and owner_res.data else None
    if not owner:
        raise HTTPException(status.HTTP_409_CONFLICT, "The referral code belongs to nobody on the list.")
    ref = f"referral:{_canon(friend)}"
    existing = await asyncio.to_thread(lambda: supabase.from_(POINTS).select("id, kind").eq("ref", ref)
                                       .in_("kind", ["referral", "referral_rejected"]).execute().data or [])

    if body.decision == "undo":
        rejected = [e for e in existing if e["kind"] == "referral_rejected"]
        if not rejected:
            raise HTTPException(status.HTTP_409_CONFLICT, "Only a rejection can be undone. To take back approved points, use a grant of -10 on the referrer.")
        await asyncio.to_thread(lambda: supabase.from_(POINTS).delete().eq("id", rejected[0]["id"]).execute())
        return {"ok": True, "status": "undone"}

    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "This referral has already been decided.")
    if body.decision == "reject":
        if not (body.reason or "").strip():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Give a reason for rejecting.")
        await asyncio.to_thread(_write_points, owner["email"], "referral_rejected", 0, body.reason.strip(), user, ref)
        return {"ok": True, "status": "rejected"}

    # Approve
    if owner.get("disqualified_at"):
        raise HTTPException(status.HTTP_409_CONFLICT, "The referrer is disqualified.")
    if friend.get("disqualified_at"):
        raise HTTPException(status.HTTP_409_CONFLICT, "This friend is disqualified.")
    done = await asyncio.to_thread(_day_done_emails, REFERRAL_DAY, [friend["email"].lower()])
    if not done:
        raise HTTPException(status.HTTP_409_CONFLICT, f"The friend hasn't finished Day {REFERRAL_DAY} yet.")
    approved = await asyncio.to_thread(lambda: supabase.from_(POINTS).select("id").eq("email", owner["email"].lower()).eq("kind", "referral").execute().data or [])
    if len(approved) >= REFERRAL_CAP:
        raise HTTPException(status.HTTP_409_CONFLICT, f"The referrer already has {REFERRAL_CAP} approved referrals.")
    reason = (body.reason or "").strip() or f"Referred {friend.get('name') or 'a friend'}"
    try:
        await asyncio.to_thread(_write_points, owner["email"], "referral", REFERRAL_POINTS, reason, user, ref)
    except Exception:
        raise HTTPException(status.HTTP_409_CONFLICT, "This referral has already been decided.")
    return {"ok": True, "status": "approved"}


# --- People -----------------------------------------------------------------

@router.get("/people")
async def search_people(q: str = "", user: AuthUser = Depends(require_admin)):
    term = re.sub(r"[^A-Za-z0-9@._+\- ]", "", q).strip()[:60]
    if len(term) < 2:
        return {"people": []}
    like = f"%{term}%"
    res = await asyncio.to_thread(lambda: supabase.from_(WAITLIST).select(WAITLIST_COLUMNS)
                                  .or_(f"email.ilike.{like},name.ilike.{like},referral_code.ilike.{like},college.ilike.{like}")
                                  .order("created_at", desc=True).limit(25).execute())
    return {"people": res.data or []}


@router.get("/people/{person_id}")
async def person_detail(person_id: str, user: AuthUser = Depends(require_admin)):
    person = await asyncio.to_thread(_person, person_id)
    email = person["email"].lower()
    now = days_api._now()
    progress, account, friends = await asyncio.gather(
        asyncio.to_thread(days_api._progress, email, now),
        asyncio.to_thread(lambda: supabase.from_("users").select("created_at").ilike("email", email).limit(1).execute().data),
        asyncio.to_thread(lambda: supabase.from_(WAITLIST).select("id, name, email, created_at")
                          .eq("referred_by_code", person.get("referral_code") or "-").execute().data or []),
    )
    states = R.day_states(progress["days"], now)
    weeks = {w: 0 for w, _, _ in R.WEEKS}
    for a in progress["answers"]:
        weeks[a["week_no"]] = weeks.get(a["week_no"], 0) + (a.get("points") or 0)
    for p in progress["extra"]:
        weeks[p["week_no"]] = weeks.get(p["week_no"], 0) + (p.get("points") or 0)
    extra = progress["extra"]
    earned = sum(1 for p in extra if p["kind"] == "reset_earned")
    used = sum(1 for p in extra if p["kind"] == "reset_used")
    history = sorted(
        ({"kind": p["kind"], "points": p["points"], "week": p["week_no"], "day": p.get("day_no"),
          "ref": p.get("ref"), "at": p.get("created_at")} for p in extra),
        key=lambda h: h["at"] or "", reverse=True,
    )
    return {
        "person": person,
        "account_created_at": account[0]["created_at"] if account else None,
        "has_account": bool(account),
        "total_points": sum(weeks.values()),
        "week_points": weeks,
        "days_done": [n for n, st, _ in states if st == "counted"],
        "days_missed": R.repairable_days(states),
        "streak": {"current": R.current_streak(states), "best": R.best_streak(states)},
        "resets": {"left": R.resets_left(earned, used, now), "earned": earned, "used": used},
        "friends": friends,
        "history": history,
    }


@router.post("/people/{person_id}/grant")
async def grant_points(person_id: str, body: GrantRequest, user: AuthUser = Depends(require_admin)):
    if body.points == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Give a number of points other than 0.")
    person = await asyncio.to_thread(_person, person_id)
    kind = "admin_grant" if body.points > 0 else "reversal"
    await asyncio.to_thread(_write_points, person["email"], kind, body.points, body.reason.strip(), user)
    return {"ok": True}


@router.post("/people/{person_id}/gift-reset")
async def gift_reset(person_id: str, body: ReasonRequest, user: AuthUser = Depends(require_admin)):
    person = await asyncio.to_thread(_person, person_id)
    await asyncio.to_thread(_write_points, person["email"], "reset_earned", 0, body.reason.strip(), user, f"gift:{uuid.uuid4()}")
    return {"ok": True}


@router.post("/people/{person_id}/disqualify")
async def disqualify(person_id: str, body: ReasonRequest, user: AuthUser = Depends(require_admin)):
    await asyncio.to_thread(_person, person_id)
    now = days_api._now()
    await asyncio.to_thread(lambda: supabase.from_(WAITLIST).update({
        "disqualified_at": now.isoformat(), "disqualified_reason": f"{body.reason.strip()} (by {user.email})",
    }).eq("id", person_id).execute())
    return {"ok": True}


@router.post("/people/{person_id}/reinstate")
async def reinstate(person_id: str, user: AuthUser = Depends(require_admin)):
    await asyncio.to_thread(_person, person_id)
    await asyncio.to_thread(lambda: supabase.from_(WAITLIST).update({"disqualified_at": None, "disqualified_reason": None}).eq("id", person_id).execute())
    return {"ok": True}


# --- Winners -----------------------------------------------------------------

@router.get("/winners")
async def winners(week: Optional[int] = None, user: AuthUser = Depends(require_admin)):
    """A board's top 10 with email, college and account, for verifying."""
    if week is not None and week not in [w for w, _, _ in R.WEEKS]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "There is no such week.")
    view = "winterarc_board_week" if week else "winterarc_board_final"

    def top():
        q = supabase.from_(view).select("email, display_name, points, on_time_days, rank, reached_at")
        if week:
            q = q.eq("week_no", week)
        return q.order("rank").order("reached_at").limit(10).execute().data or []

    rows = await asyncio.to_thread(top)
    emails = [r["email"] for r in rows]
    people = await asyncio.to_thread(lambda: supabase.from_(WAITLIST).select(WAITLIST_COLUMNS).in_("email", emails).execute().data or []) if emails else []
    by_email = {p["email"].lower(): p for p in people}
    now = days_api._now()
    closes = R.week_closes(week) if week else R.ends_at()
    return {
        "week": week,
        "closed": now >= closes,
        "closes_at": closes.isoformat(),
        "rows": [{**r, "person_id": (by_email.get(r["email"]) or {}).get("id"),
                  "name": (by_email.get(r["email"]) or {}).get("name"),
                  "college": (by_email.get(r["email"]) or {}).get("college")} for r in rows],
    }
