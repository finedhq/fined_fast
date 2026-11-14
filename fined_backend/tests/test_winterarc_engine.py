"""WinterArc daily engine: unlock, members only, hidden answers, tries, late points."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.dependencies import AuthUser
from app.routes import winterarc_days as wd
from app.services import winterarc_rules as R

IST = timezone(timedelta(hours=5, minutes=30))


def ist(day, hour=0, minute=0):
    return datetime(2026, 12, day, hour, minute, tzinfo=IST)


# --- A small in-memory stand-in for the Supabase client --------------------

class Res:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, db, table):
        self.db, self.table = db, table
        self.filters, self.mode, self.payload = [], "select", None

    def select(self, *_):
        return self

    def eq(self, col, val):
        self.filters.append(lambda r, c=col, v=val: r.get(c) == v)
        return self

    def ilike(self, col, val):
        self.filters.append(lambda r, c=col, v=val: str(r.get(c, "")).lower() == str(v).lower())
        return self

    def in_(self, col, vals):
        self.filters.append(lambda r, c=col, v=tuple(vals): r.get(c) in v)
        return self

    def order(self, col, **_):
        self.order_by = col
        return self

    def limit(self, _):
        return self

    def insert(self, rows):
        self.mode, self.payload = "insert", rows
        return self

    def update(self, change):
        self.mode, self.payload = "update", change
        return self

    def delete(self):
        self.mode = "delete"
        return self

    def execute(self):
        rows = self.db.tables.setdefault(self.table, [])
        if self.mode == "insert":
            out = []
            for r in self.payload:
                if self.table == "winterarc_answers" and any(
                    x["email"] == r["email"] and x["card_id"] == r["card_id"] for x in rows
                ):
                    raise Exception("duplicate key")
                if self.table == "winterarc_points" and r.get("ref") and any(
                    x["email"] == r["email"] and x["kind"] == r["kind"] and x.get("ref") == r["ref"] for x in rows
                ):
                    raise Exception("duplicate key")
                row = {"id": str(uuid.uuid4()), **r}
                rows.append(row)
                out.append(dict(row))
            return Res(out)
        hits = [r for r in rows if all(f(r) for f in self.filters)]
        if self.mode == "delete":
            for r in hits:
                rows.remove(r)
            return Res([dict(r) for r in hits])
        if self.mode == "update":
            for r in hits:
                r.update(self.payload)
            return Res([dict(r) for r in hits])
        if getattr(self, "order_by", None):
            hits = sorted(hits, key=lambda r: r.get(self.order_by) or 0)
        return Res([dict(r) for r in hits])


class DB:
    def __init__(self):
        self.tables = {}

    def from_(self, table):
        return Query(self, table)


def quiz(card_id, module_id, right="b", order=1):
    return {
        "card_id": card_id, "module_id": module_id, "order_index": order, "slug": f"q-{card_id}",
        "card_template": "quiz",
        "card_data": {
            "card_type": "quiz", "question": "Which?", "explanation": "Because.",
            "options": [{"id": x, "text": x, "is_correct": x == right} for x in "abcd"],
        },
    }


@pytest.fixture
def db(monkeypatch):
    fake = DB()
    monkeypatch.setattr(wd, "supabase", fake)
    wd.clear_cache()
    monkeypatch.setattr(R.settings, "WINTERARC_START", "2026-12-01T00:00:00+05:30")
    fake.tables["courses"] = [{"id": "course", "slug": R.settings.WINTERARC_COURSE_SLUG}]
    fake.tables["modules"] = [
        {"id": f"m{n}", "course_id": "course", "order_index": n, "title": f"Day {n}", "slug": f"d{n}",
         "status": "published" if n <= 3 or n == 30 else "draft"}
        for n in range(1, 31)
    ]
    fake.tables["cards"] = [
        {"card_id": f"hero{n}", "module_id": f"m{n}", "order_index": 0, "slug": f"h{n}", "card_template": "hero", "card_data": {}}
        for n in range(1, 31)
    ] + [quiz(f"c{n}{k}", f"m{n}", order=k) for n in range(1, 31) for k in (1, 2, 3)]
    fake.tables["winterarc_waitlist"] = [{"id": "w1", "email": "member@x.com"}]
    return fake


def at(monkeypatch, when):
    monkeypatch.setattr(wd, "_now", lambda: when)


MEMBER = AuthUser(email="Member@x.com", sub="s1")
STRANGER = AuthUser(email="new@x.com", sub="s2")
ADMIN = AuthUser(email="boss@x.com", sub="s3", roles=["Admin"])


def run(coro):
    return asyncio.run(coro)


def answer(day, card_id, ans, user=MEMBER):
    return run(wd.answer_question(day, wd.AnswerRequest(card_id=card_id, answer=ans), user))


def status_of(fn):
    with pytest.raises(HTTPException) as e:
        fn()
    return e.value.status_code


# --- Rules -------------------------------------------------------------------

def test_days_open_at_midnight_ist(db):
    assert R.opens_at(1) == ist(1)
    assert R.opens_at(30) == ist(30)
    assert not R.is_open(2, ist(1, 23, 59))
    assert R.is_open(2, ist(2))


def test_late_window_and_week_cutoff(db):
    assert R.points_for(1, True, 1, ist(1, 1)) == 10
    assert R.points_for(1, True, 1, ist(2, 11, 59)) == 10   # 35h59m
    assert R.points_for(1, True, 1, ist(2, 12)) == 5        # 36h: half
    assert R.points_for(2, True, 1, ist(2, 12)) == 2        # half of 5, rounded down
    assert R.points_for(1, True, 1, ist(6, 23, 59)) == 5    # still week 1
    assert R.points_for(1, True, 1, ist(7)) == 0            # week 1 closed
    # Sunday's day only gets the hours left before the cut-off
    assert R.points_for(1, True, 6, ist(6, 23)) == 10
    assert R.points_for(1, True, 6, ist(7, 0, 1)) == 0


def test_finale_has_no_late_window(db):
    assert R.points_for(1, True, 30, ist(30, 23, 59)) == 10
    assert R.points_for(1, True, 30, ist(30) + timedelta(days=1)) == 0


def test_retry_scale_and_finish(db):
    assert [R.points_for(t, True, 2, ist(2, 1)) for t in (1, 2, 3, 4)] == [10, 5, 2, 0]
    assert R.points_for(1, False, 2, ist(2, 1)) == 0
    assert R.is_finished(1, True) and R.is_finished(3, False) and not R.is_finished(2, False)


def test_weeks(db):
    assert [R.week_of(d) for d in (1, 6, 7, 13, 14, 27, 28, 30)] == [1, 1, 2, 2, 3, 4, 5, 5]


def test_hide_answer_removes_every_key(db):
    hidden = R.hide_answer({
        "options": [{"id": "a", "text": "A", "is_correct": True}],
        "items": [{"id": "i", "label": "I", "zone": "z"}],
        "correct_order": ["i"], "correct": 101, "explanation": "x", "question": "Q",
    })
    text = str(hidden)
    assert "is_correct" not in text and "zone" not in text and "correct_order" not in text
    assert "correct" not in hidden and "explanation" not in hidden and hidden["question"] == "Q"


# --- Who can open a day ------------------------------------------------------

def test_people_not_on_the_list_cannot_open_a_day(db, monkeypatch):
    at(monkeypatch, ist(2))
    assert status_of(lambda: run(wd.open_day(1, STRANGER))) == 403
    assert run(wd.my_challenge(STRANGER))["joined"] is False


def test_day_locked_before_its_time_and_before_publishing(db, monkeypatch):
    at(monkeypatch, ist(1, 12))
    assert status_of(lambda: run(wd.open_day(2, MEMBER))) == 423      # not 2 Dec yet
    at(monkeypatch, ist(5))
    assert status_of(lambda: run(wd.open_day(4, MEMBER))) == 423      # time passed, still a draft
    assert run(wd.open_day(3, MEMBER))["day"] == 3
    assert status_of(lambda: run(wd.open_day(31, MEMBER))) == 404


def test_admin_can_preview_any_day(db, monkeypatch):
    at(monkeypatch, ist(1))
    day = run(wd.open_day(20, ADMIN))
    assert day["preview"] is True


def test_answer_key_never_sent_before_finishing(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    day = run(wd.open_day(1, MEMBER))
    assert "is_correct" not in str(day["cards"]) and "Because." not in str(day["cards"])
    res = answer(1, "c11", "a")                     # wrong, 2 tries left
    assert res["right"] is False and res["tries_left"] == 2 and "card_data" not in res
    assert res["on_offer"] == 5
    res = answer(1, "c11", "b")                     # right on try 2
    assert res["finished"] and res["points"] == 5 and res["card_data"]["explanation"] == "Because."
    again = run(wd.open_day(1, MEMBER))
    q = next(c for c in again["cards"] if c["card_id"] == "c11")
    assert q["userAnswer"] == "b" and q["card_data"]["options"][1]["is_correct"] is True


def test_three_wrong_tries_finish_with_no_points(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    for _ in range(3):
        res = answer(1, "c12", "d")
    assert res["finished"] and res["points"] == 0 and res["card_data"]
    assert status_of(lambda: answer(1, "c12", "b")) == 409


def test_malformed_answer_never_uses_a_try(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    assert status_of(lambda: answer(1, "c11", "zzz")) == 400
    assert answer(1, "c11", "a")["tries"] == 1


def test_answer_fits_every_format(db):
    sort = {"format": "sort", "items": [{"id": "x"}, {"id": "y"}], "zones": [{"id": "z1"}, {"id": "z2"}]}
    assert R.answer_fits(sort, "x=z1;y=z2") and not R.answer_fits(sort, "y=z1;x=z2") and not R.answer_fits(sort, "x=z1")
    order = {"format": "order", "items": [{"id": "a"}, {"id": "b"}]}
    assert R.answer_fits(order, "b,a") and not R.answer_fits(order, "a,a")
    multi = {"format": "multi", "options": [{"id": "a"}, {"id": "b"}, {"id": "c"}]}
    assert R.answer_fits(multi, "a,c") and not R.answer_fits(multi, "a,a") and not R.answer_fits(multi, "a,z")
    assert R.answer_fits({"format": "order_book"}, "101") and not R.answer_fits({"format": "order_book"}, "cheap")


def test_cannot_answer_a_locked_day_or_another_days_question(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    assert status_of(lambda: answer(2, "c21", "b")) == 423
    assert status_of(lambda: answer(1, "c21", "b")) == 404
    assert status_of(lambda: answer(1, "hero1", "b")) == 404


def test_email_case_does_not_make_a_second_row(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    answer(1, "c13", "a", AuthUser(email="MEMBER@x.com", sub="s1"))
    answer(1, "c13", "a", AuthUser(email="member@X.com", sub="s1"))
    rows = [r for r in db.tables["winterarc_answers"] if r["card_id"] == "c13"]
    assert len(rows) == 1 and rows[0]["tries"] == 2


def test_lost_race_is_retried_not_double_counted(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    answer(1, "c11", "a")
    real = wd._get_row
    calls = {"n": 0}

    def stale(email, card_id):
        # First read returns a copy that another tap then moves on from
        row = real(email, card_id)
        calls["n"] += 1
        if calls["n"] == 1:
            live = next(r for r in db.tables["winterarc_answers"] if r["card_id"] == card_id)
            live["tries"] += 1
        return row

    monkeypatch.setattr(wd, "_get_row", stale)
    res = answer(1, "c11", "a")
    assert res["tries"] == 3 and res["finished"]


def test_hub_scores_by_week(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    answer(1, "c11", "b")
    answer(1, "c12", "b")
    at(monkeypatch, ist(3, 9))
    answer(1, "c13", "b")                           # 48h late: half
    answer(3, "c31", "b")
    db.tables["winterarc_points"] = [{"email": "member@x.com", "kind": "admin_grant", "points": 7, "week_no": 2, "created_at": ist(3).isoformat()}]
    hub = run(wd.my_challenge(MEMBER))
    assert hub["today"] == 3
    assert hub["days"][0]["status"] == "done" and hub["days"][0]["points"] == 25
    assert hub["days"][1]["status"] == "not_started"
    assert hub["days"][2]["status"] == "started"
    assert hub["days"][3]["open"] is False and hub["days"][3]["title"] is None
    assert hub["week_points"][1] == 35 and hub["week_points"][2] == 7 and hub["total_points"] == 42


def test_admin_calendar_flags_problems(db, monkeypatch):
    at(monkeypatch, ist(5))
    db.tables["cards"] = [c for c in db.tables["cards"] if c["card_id"] != "c23"]
    cal = run(wd.admin_calendar(ADMIN))
    d = {x["day"]: x for x in cal["days"]}
    assert d[1]["problems"] == []
    assert any("2 questions" in p for p in d[2]["problems"])
    assert any("isn't published" in p for p in d[4]["problems"])


# --- Streaks, bonuses, resets ------------------------------------------------

def done(*days, late=()):
    """Day -> state input: finished on its own day (or the late days after the deadline)."""
    return {n: {"opened": True, "done_at": ist(n, 20) + (timedelta(days=3) if n in late else timedelta())} for n in days}


def test_streak_counts_until_noon_next_day(db):
    days = {1: {"opened": True, "done_at": ist(2, 11, 59)}, 2: {"opened": True, "done_at": ist(3, 12, 1)},
            3: {"opened": True}, 4: {"opened": True}}
    states = R.day_states(days, ist(4, 9))
    assert [s for _, s, _ in states] == ["counted", "missed", "pending", "pending"]   # day 3 counts until noon on 4 Dec


def test_unpublished_day_neither_counts_nor_breaks(db):
    days = done(1, 2, 4)
    days[3] = {"opened": False}
    states = R.day_states(days, ist(5, 1))
    assert R.current_streak(states) == 3


def test_rebuilt_streak_earns_the_7_day_bonus_again(db):
    days = done(*range(1, 8), *range(9, 16))      # day 8 missed
    days[8] = {"opened": True}
    runs = R.streak_runs(R.day_states(days, ist(16, 1)))
    refs = {b["ref"] for b in R.streak_bonuses(runs)}
    assert refs == {"streak:1:7", "streak:9:7"}


def test_reset_repairs_a_missed_day_and_joins_the_streak(db):
    days = done(*range(1, 8), *range(9, 16))
    days[8] = {"opened": True, "done_at": None, "reset_at": ist(16, 2)}
    states = R.day_states(days, ist(16, 3))
    assert R.current_streak(states) == 15 and R.repairable_days(states) == []
    bonus14 = next(b for b in R.streak_bonuses(R.streak_runs(states)) if b["length"] == 14)
    assert bonus14["at"] == ist(16, 2)               # reached when the reset was spent


def test_full_week_earns_a_reset_once_the_week_closes(db):
    days = done(1, 2, 3, 4, 5, late=(3,))           # day 3 finished late, still in week 1
    days[6] = {"opened": True, "done_at": ist(6, 22)}
    assert R.weeks_fully_done(days, ist(6, 23)) == []
    assert R.weeks_fully_done(days, ist(7, 1)) == [1]
    days[6] = {"opened": True, "done_at": None}
    assert R.weeks_fully_done(days, ist(7, 1)) == []


def test_repaired_day_pays_half_until_the_end(db):
    assert R.points_for(1, True, 2, ist(20), repaired=True) == 5
    assert R.points_for(1, True, 2, ist(20), repaired=False) == 0
    assert R.answer_week(2, ist(20), repaired=True) == 3
    assert R.points_for(1, True, 2, ist(30) + timedelta(days=1), repaired=True) == 0


def test_resets_left_and_expiry(db):
    assert R.resets_left(1, 2, ist(10)) == 1
    assert R.resets_left(0, 0, ist(30) + timedelta(days=1)) == 0


def test_reset_route_and_bonus_written_once(db, monkeypatch):
    # Days 1-3 done on time, day 4 missed, then a reset on day 4
    for n in (1, 2, 3):
        at(monkeypatch, ist(n, 9))
        for k in (1, 2, 3):
            answer(n, f"c{n}{k}", "b")
    for m in db.tables["modules"]:
        if m["order_index"] in (4, 5, 6, 7):
            m["status"] = "published"
    wd.clear_cache()                                   # days published mid-test
    at(monkeypatch, ist(5, 13))
    hub = run(wd.my_challenge(MEMBER))
    assert hub["resets"]["missed_days"] == [4] and hub["resets"]["left"] == 2
    assert hub["streak"]["current"] == 0
    assert status_of(lambda: run(wd.use_reset(wd.ResetRequest(day=2), MEMBER))) == 409
    res = run(wd.use_reset(wd.ResetRequest(day=4), MEMBER))
    assert res["resets_left"] == 1
    assert status_of(lambda: run(wd.use_reset(wd.ResetRequest(day=4), MEMBER))) == 409
    # Day 4 now pays half; days 5-7 on time make a 7-day streak (1-7)
    q = run(wd.open_day(4, MEMBER))["questions"]["c41"]
    assert q["on_offer"] == 5
    for n in (5, 6, 7):
        at(monkeypatch, ist(n, 9))
        for k in (1, 2, 3):
            answer(n, f"c{n}{k}", "b")
    bonuses = [p for p in db.tables["winterarc_points"] if p["kind"] == "streak_bonus"]
    assert [b["ref"] for b in bonuses] == ["streak:1:7"] and bonuses[0]["points"] == 10
    run(wd.my_challenge(MEMBER))                       # syncing again writes nothing new
    assert len([p for p in db.tables["winterarc_points"] if p["kind"] == "streak_bonus"]) == 1
    hub = run(wd.my_challenge(MEMBER))
    assert hub["streak"]["current"] == 7 and hub["streak"]["next_bonus"] == {"days": 14, "points": 20}


def test_answer_rows_record_on_time_and_week(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    answer(1, "c11", "b")
    at(monkeypatch, ist(3, 9))
    answer(1, "c12", "b")
    rows = {r["card_id"]: r for r in db.tables["winterarc_answers"]}
    assert rows["c11"]["on_time"] is True and rows["c12"]["on_time"] is False
    assert rows["c12"]["week_no"] == 1


# --- The optional daily action ----------------------------------------------

def test_daily_action_tick_and_untick(db, monkeypatch):
    db.tables["cards"].append({"card_id": "done1", "module_id": "m1", "order_index": 9, "slug": "d1", "card_template": "completion",
                               "card_data": {"card_type": "completion", "winterarc_action": "  Check your savings rate.  "}})
    at(monkeypatch, ist(1, 9))
    day = run(wd.open_day(1, MEMBER))
    assert day["action"] == {"text": "Check your savings rate.", "done": False}
    run(wd.tick_action(1, wd.ActionRequest(done=True), MEMBER))
    run(wd.tick_action(1, wd.ActionRequest(done=True), MEMBER))     # twice is still once
    assert len([p for p in db.tables["winterarc_points"] if p["kind"] == "action_done"]) == 1
    assert run(wd.open_day(1, MEMBER))["action"]["done"] is True
    run(wd.tick_action(1, wd.ActionRequest(done=False), MEMBER))
    assert run(wd.open_day(1, MEMBER))["action"]["done"] is False
    # Ticking adds no points
    assert run(wd.my_challenge(MEMBER))["total_points"] == 0


def test_day_without_action(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    assert run(wd.open_day(1, MEMBER))["action"] is None
    assert status_of(lambda: run(wd.tick_action(1, wd.ActionRequest(done=True), MEMBER))) == 404


def test_shared_content_is_cached_but_membership_waits_until_found(db, monkeypatch):
    at(monkeypatch, ist(1, 9))
    calls = {"courses": 0, "waitlist": 0}
    real = db.from_

    def counting(table):
        if table in calls:
            calls[table] += 1
        return real(table)

    monkeypatch.setattr(db, "from_", counting)
    run(wd.open_day(1, MEMBER))
    run(wd.open_day(1, MEMBER))
    assert calls["courses"] == 1                       # course read once, then cached
    assert calls["waitlist"] <= 2                      # member row found once, then cached
    # Someone not yet on the list is checked again each time (so joining lets them in at once)
    assert status_of(lambda: run(wd.open_day(1, STRANGER))) == 403
    db.tables["winterarc_waitlist"].append({"id": "w2", "email": "new@x.com"})
    assert run(wd.open_day(1, STRANGER))["day"] == 1
