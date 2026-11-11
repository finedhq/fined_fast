# WinterArc scoring rules: plain functions, no database, so they can be tested
# on a fake clock. Values match the rules page (winterarcConfig.js); change
# both together.
#
#   - Day n opens at midnight IST on n Dec (WINTERARC_START + n-1 days).
#   - Each question: up to 3 tries, worth 10, then 5, then 2 points. It is
#     finished on a right answer or after the third try.
#   - Full points within 36 hours of the day opening; 50% (rounded down) after
#     that until the day's leaderboard week closes (Sunday midnight IST);
#     nothing after. Day 30 (the finale) has no late window: full points until
#     the end of Day 30.
#   - Streaks: a day counts if it is finished (every question) by noon IST the
#     next day, or if a reset was spent on it. A day that never opened (not
#     published) neither counts nor breaks a streak. Each time a streak
#     reaches 7, 14, 21 or 30 days it earns that bonus, so a rebuilt streak
#     earns the 7-day bonus again.
#   - Resets: 2 to start, +1 for finishing every task in a leaderboard week
#     (weeks 1-4, any time before that week closes). A reset repairs one missed
#     day's streak; that day's task can then be done for 50% until the end of
#     30 Dec, the points counting in the week they are earned.
import math
from datetime import datetime, timedelta

from app.config import settings

TOTAL_DAYS = 30
FINALE_DAY = 30
QUESTIONS_PER_DAY = 3
TRY_POINTS = (10, 5, 2)
MAX_TRIES = len(TRY_POINTS)
LATE_FULL_HOURS = 36
LATE_PERCENT = 50
RESET_PERCENT = 50
STARTING_RESETS = 2
STREAK_GRACE_HOURS = 36            # noon IST the day after a day opens
STREAK_BONUSES = ((7, 10), (14, 20), (21, 30), (30, 40))

# Leaderboard weeks, by day number (inclusive). Sunday closes each week.
WEEKS = (
    (1, 1, 6),
    (2, 7, 13),
    (3, 14, 20),
    (4, 21, 27),
    (5, 28, 30),
)


def start() -> datetime:
    return datetime.fromisoformat(settings.WINTERARC_START)


def valid_day(day: int) -> bool:
    return isinstance(day, int) and 1 <= day <= TOTAL_DAYS


def opens_at(day: int) -> datetime:
    return start() + timedelta(days=day - 1)


def week_of(day: int) -> int:
    return next(w for w, a, b in WEEKS if a <= day <= b)


def week_closes_at(day: int) -> datetime:
    """Midnight IST at the end of the last day of this day's week."""
    last = next(b for w, a, b in WEEKS if a <= day <= b)
    return start() + timedelta(days=last)


def is_open(day: int, now: datetime) -> bool:
    return now >= opens_at(day)


def ends_at() -> datetime:
    """The end of Day 30: every late window and unused reset ends here."""
    return start() + timedelta(days=TOTAL_DAYS)


def week_closes(week: int) -> datetime:
    last = next(b for w, a, b in WEEKS if w == week)
    return start() + timedelta(days=last)


def week_at(now: datetime) -> int:
    """The leaderboard week a moment falls in (the last week after the end)."""
    day = (now - start()).days + 1
    return week_of(min(max(day, 1), TOTAL_DAYS))


def late_factor(day: int, now: datetime, repaired: bool = False) -> float:
    """Share of a question's points still on offer at `now` (1, 0.5 or 0).
    A day repaired with a reset keeps RESET_PERCENT until the challenge ends."""
    if now < opens_at(day):
        return 0.0
    if repaired and now >= opens_at(day) + timedelta(hours=LATE_FULL_HOURS):
        return RESET_PERCENT / 100 if now < ends_at() else 0.0
    if now >= week_closes_at(day):
        return 0.0
    if day == FINALE_DAY:
        return 1.0 if now < opens_at(day) + timedelta(days=1) else 0.0
    if now < opens_at(day) + timedelta(hours=LATE_FULL_HOURS):
        return 1.0
    return LATE_PERCENT / 100


def points_for(try_no: int, right: bool, day: int, now: datetime, repaired: bool = False) -> int:
    """Points for finishing a question on try `try_no` (1-based)."""
    if not right or try_no < 1 or try_no > MAX_TRIES:
        return 0
    return math.floor(TRY_POINTS[try_no - 1] * late_factor(day, now, repaired))


def points_on_offer(tries_used: int, day: int, now: datetime, repaired: bool = False) -> int:
    """What a right answer on the next try would earn (shown on the question)."""
    return points_for(tries_used + 1, True, day, now, repaired)


def on_time(day: int, now: datetime) -> bool:
    """Finished inside the full-points window (a leaderboard tie-break)."""
    return late_factor(day, now) == 1.0


def answer_week(day: int, now: datetime, repaired: bool = False) -> int:
    """The week a finished question's points count in: the day's own week,
    except points earned on a repaired day after its week closed, which count
    in the week they are earned."""
    if repaired and now >= week_closes_at(day):
        return week_at(now)
    return week_of(day)


def is_finished(tries: int, right: bool) -> bool:
    return right or tries >= MAX_TRIES


# --- Hiding answers until a question is finished -------------------------

def hide_answer(card_data: dict) -> dict:
    """A quiz card's data without anything that gives the answer away."""
    d = dict(card_data or {})
    d["options"] = [{k: v for k, v in o.items() if k != "is_correct"} for o in d.get("options") or []]
    d["items"] = [{k: v for k, v in i.items() if k != "zone"} for i in d.get("items") or []]
    d.pop("correct_order", None)
    d.pop("correct", None)
    d.pop("explanation", None)
    return d


def answer_fits(cd: dict, answer: str) -> bool:
    """Is `answer` a possible answer to this question at all (right or wrong)?
    Mirrors decodeQuiz() in quizFormats.js. A malformed answer never uses a try."""
    d = cd or {}
    f = d.get("format") or "choice"
    options = {o.get("id") for o in d.get("options") or []}
    items = [i.get("id") for i in d.get("items") or []]
    if not isinstance(answer, str) or not answer:
        return False
    if f == "choice":
        return answer in options
    if f == "multi":
        ids = answer.split(",")
        return len(set(ids)) == len(ids) and all(i in options for i in ids)
    if f == "order":
        return sorted(answer.split(",")) == sorted(items)
    if f == "sort":
        zones = {z.get("id") for z in d.get("zones") or []}
        pairs = [p.split("=") for p in answer.split(";")]
        return len(pairs) == len(items) and all(len(p) == 2 and p[0] == items[k] and p[1] in zones for k, p in enumerate(pairs))
    if f == "order_book":
        try:
            float(answer)
            return True
        except ValueError:
            return False
    return False


def is_quiz(card: dict) -> bool:
    return (card.get("card_template") or (card.get("card_data") or {}).get("card_type")) == "quiz"


def day_status(questions_finished: int, questions_total: int) -> str:
    if questions_total and questions_finished >= questions_total:
        return "done"
    return "started" if questions_finished else "not_started"


# --- Streaks, bonuses and resets -------------------------------------------

def streak_deadline(day: int) -> datetime:
    return opens_at(day) + timedelta(hours=STREAK_GRACE_HOURS)


def day_states(days: dict, now: datetime) -> list:
    """Each day up to today, in order, as (day, state, counted_at).
    `days` = day -> {"opened": bool, "done_at": datetime|None, "reset_at": datetime|None}
    (done_at = when its last question was finished; reset_at = reset spent).
    state: counted | pending (can still count) | missed | skipped (never opened)."""
    out = []
    for n in range(1, TOTAL_DAYS + 1):
        if now < opens_at(n):
            break
        d = days.get(n) or {}
        done_at, reset_at = d.get("done_at"), d.get("reset_at")
        if not d.get("opened"):
            out.append((n, "skipped", None))
        elif done_at and done_at <= streak_deadline(n):
            out.append((n, "counted", done_at))
        elif reset_at:
            out.append((n, "counted", reset_at))
        elif now <= streak_deadline(n) and not done_at:
            out.append((n, "pending", None))
        else:
            out.append((n, "missed", None))
    return out


def streak_runs(states: list) -> list:
    """Unbroken runs of counted days: lists of (day, counted_at).
    Skipped and pending days don't break a run; a missed day does."""
    runs, run = [], []
    for n, state, at in states:
        if state == "counted":
            run.append((n, at))
        elif state == "missed":
            if run:
                runs.append(run)
            run = []
    if run:
        runs.append(run)
    return runs


def streak_bonuses(runs: list) -> list:
    """Every bonus these runs have earned: {ref, points, at, length}.
    `at` = when the streak reached that length (the latest of its first days)."""
    out = []
    for run in runs:
        for length, points in STREAK_BONUSES:
            if len(run) >= length:
                out.append({
                    "ref": f"streak:{run[0][0]}:{length}",
                    "points": points,
                    "length": length,
                    "at": max(at for _, at in run[:length]),
                })
    return out


def current_streak(states: list) -> int:
    """Length of the streak still alive (no missed day after it)."""
    length = 0
    for _, state, _ in states:
        if state == "counted":
            length += 1
        elif state == "missed":
            length = 0
    return length


def best_streak(states: list) -> int:
    return max((len(r) for r in streak_runs(states)), default=0)


def repairable_days(states: list) -> list:
    return [n for n, state, _ in states if state == "missed"]


def weeks_fully_done(days: dict, now: datetime) -> list:
    """Closed weeks 1-4 in which every opened day was finished before the week
    closed (each earns one extra reset)."""
    out = []
    for w, a, b in WEEKS:
        if w == 5 or now < week_closes(w):
            continue
        opened = [n for n in range(a, b + 1) if (days.get(n) or {}).get("opened")]
        if opened and all((days[n].get("done_at") or ends_at()) < week_closes(w) for n in opened):
            out.append(w)
    return out


def resets_left(earned: int, used: int, now: datetime) -> int:
    if now >= ends_at():
        return 0
    return max(0, STARTING_RESETS + earned - used)
