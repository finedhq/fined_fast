"""WinterArc waitlist: first-touch source, one row per email, referral codes."""
import asyncio

import pytest
from fastapi import HTTPException

from app.routes import winterarc as wa


class FakeQuery:
    def __init__(self, table):
        self.table, self.filters, self.payload = table, [], None

    def select(self, *_):
        return self

    def ilike(self, col, val):
        self.filters.append((col, val.lower()))
        return self

    def eq(self, col, val):
        self.filters.append((col, val))
        return self

    def limit(self, _):
        return self

    def insert(self, rows):
        self.payload = rows
        return self

    def execute(self):
        class R:
            pass
        r = R()
        if self.payload is not None:
            for row in self.payload:
                if any(x["email"] == row["email"] or x["referral_code"] == row["referral_code"] for x in self.table):
                    raise Exception("duplicate key")
                self.table.append(dict(row))
            r.data = self.payload
        else:
            r.data = [x for x in self.table if all(str(x.get(c, "")).lower() == str(v).lower() for c, v in self.filters)]
        return r


class FakeSupabase:
    def __init__(self):
        self.rows = []

    def from_(self, _):
        return FakeQuery(self.rows)


@pytest.fixture
def db(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(wa, "supabase", fake)
    return fake


def join(**kw):
    base = {"email": "a@x.com", "age_confirmed": True, "consent": True}
    base.update(kw)
    return asyncio.run(wa.join_waitlist(wa.WaitlistRequest(**base)))


def test_join_creates_row_with_source(db):
    res = join(utm_source="ig", utm_campaign="launch", heard_from="instagram")
    assert res["already_joined"] is False
    assert len(res["referral_code"]) == wa.CODE_LENGTH
    row = db.rows[0]
    assert row["utm_source"] == "ig" and row["heard_from"] == "instagram"
    assert row["consent_version"] == wa.CONSENT_VERSION


def test_same_email_counted_once_and_source_kept(db):
    first = join(email="A@x.com", utm_source="college")
    again = join(email="a@X.com ", utm_source="instagram")
    assert again == {"referral_code": first["referral_code"], "already_joined": True}
    assert len(db.rows) == 1 and db.rows[0]["utm_source"] == "college"


def test_referral_code_stored_only_if_real(db):
    friend = join(email="f@x.com")["referral_code"]
    join(email="b@x.com", ref=friend.lower())
    join(email="c@x.com", ref="NOPE99")
    by_email = {r["email"]: r for r in db.rows}
    assert by_email["b@x.com"]["referred_by_code"] == friend
    assert by_email["c@x.com"]["referred_by_code"] is None


@pytest.mark.parametrize("kw", [
    {"email": "not-an-email"},
    {"age_confirmed": False},
    {"consent": False},
])
def test_rejects_bad_input(db, kw):
    with pytest.raises(HTTPException):
        join(**kw)
    assert db.rows == []


def test_unknown_heard_from_becomes_other(db):
    join(heard_from="tiktok")
    assert db.rows[0]["heard_from"] == "other"
