"""WinterArc admin tools: one person per inbox, referral statuses and flags."""
from app.routes.winterarc import canonical_email
from app.routes.winterarc_admin import REFERRAL_CAP, build_referrals


def test_canonical_email():
    assert canonical_email("A.B+winter@Gmail.com") == "ab@gmail.com"
    assert canonical_email("ab@googlemail.com") == "ab@gmail.com"
    assert canonical_email("first.last+x@college.edu") == "first.last@college.edu"


def row(i, **kw):
    base = {"id": f"id{i}", "email": f"p{i}@x.com", "name": f"Person {i}", "college": "",
            "referral_code": f"C{i}", "created_at": f"2026-11-10T{10 + i % 10:02d}:00:00+05:30"}
    base.update(kw)
    return base


def test_statuses():
    rows = [row(0), row(1, referred_by_code="C0"), row(2, referred_by_code="C0"), row(3, referred_by_code="C0")]
    decisions = [{"email": "p0@x.com", "kind": "referral", "ref": "referral:p2@x.com", "reason": "ok"},
                 {"email": "p0@x.com", "kind": "referral_rejected", "ref": "referral:p3@x.com", "reason": "fake"}]
    out = {r["friend_id"]: r for r in build_referrals(rows, decisions, day3_done={"p1@x.com"})}
    assert out["id1"]["status"] == "ready"
    assert out["id2"]["status"] == "approved"
    assert out["id3"]["status"] == "rejected" and out["id3"]["decided_reason"] == "fake"
    assert out["id1"]["referrer_name"] == "Person 0"


def test_waiting_until_day_3():
    rows = [row(0), row(1, referred_by_code="C0")]
    assert build_referrals(rows, [], set())[0]["status"] == "waiting"


def test_flags():
    rows = [
        row(0, name="Asha Rao", college="Xavier's"),
        row(1, referred_by_code="C0", name="asha  rao", college="xavier's"),            # lookalike
        row(2, referred_by_code="C0", email="z@mailinator.com"),                          # throwaway
        row(3, referred_by_code="C0", email="a.b@gmail.com"),
        row(4, email="ab+x@gmail.com"),                                                   # same inbox as 3
        row(5, referred_by_code="NOPE"),
    ]
    out = {r["friend_id"]: r["flags"] for r in build_referrals(rows, [], set())}
    assert any("name and college" in f for f in out["id1"])
    assert any("Throwaway" in f for f in out["id2"])
    assert any("same inbox" in f for f in out["id3"])
    assert out["id5"] == ["The referral code belongs to nobody on the list."]


def test_burst_and_cap_flags():
    owner = row(0)
    friends = [row(i, referred_by_code="C0", created_at=f"2026-11-10T10:{i:02d}:00+05:30") for i in range(1, 7)]
    approved = [{"email": "p0@x.com", "kind": "referral", "ref": f"referral:q{i}@x.com", "reason": ""} for i in range(REFERRAL_CAP)]
    out = build_referrals([owner, *friends], approved, set())
    assert all(any("within an hour" in f for f in r["flags"]) for r in out)
    assert all(any("cap" in f for f in r["flags"]) for r in out)


# --- Prizes (2026-11-15): referral award minimum, contest windows, daily boards ---

from datetime import datetime

from app.services import winterarc_rules as R


def contest_row(code, referrals, rank, at="2026-11-20T10:00:00+05:30"):
    return {"code": code, "referrer_name": code, "referrals": referrals, "rank": rank, "reached_at": at}


def test_award_needs_five_friends():
    rows = R.contest_standings([contest_row("A", 4, 1), contest_row("B", 3, 2)])
    assert not any(r["eligible"] for r in rows)
    assert not any(r["leading"] for r in rows)


def test_award_goes_to_best_eligible():
    rows = R.contest_standings([contest_row("B", 5, 2), contest_row("A", 9, 1), contest_row("C", 2, 3)])
    assert [r["code"] for r in rows] == ["A", "B", "C"]
    assert [r["leading"] for r in rows] == [True, False, False]
    assert [r["eligible"] for r in rows] == [True, True, False]


def test_contest_windows():
    ist = lambda s: datetime.fromisoformat(s)
    assert R.contest_at(ist("2026-11-15T12:00:00+05:30")) == "nov"
    assert R.contest_at(ist("2026-11-30T23:59:00+05:30")) == "nov"
    assert R.contest_at(ist("2026-12-01T00:00:01+05:30")) == "dec"
    assert R.contest_at(ist("2027-01-05T00:00:00+05:30")) == "dec"


def test_day_board_closes_after_full_window():
    assert R.day_closes(3) - R.opens_at(3) == (R.opens_at(2) - R.opens_at(1)) * 1.5
