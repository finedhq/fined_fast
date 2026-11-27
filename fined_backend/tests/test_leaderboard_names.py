# Leaderboard names instead of emails (2026-11-27). No database: every
# Supabase call here goes to a small stand-in.
import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import AuthUser, get_current_user, get_optional_current_user
from app.repositories import user_repo as user_repo_module
from app.repositories.user_repo import user_repo
from app.routes import home as home_routes
from app.routes.home import public_name
from app.services.home_service import home_service

ROWS = [
    {"email": "anish.pujari@gmail.com", "user_sub": "g|1", "full_name": "Anish Pujari", "username": None,
     "article_score": 10, "course_score": 90, "consistency_score": 0, "fin_stars": 5, "fin_score": 100, "rank": 1},
    {"email": "Riya@Example.com", "user_sub": "g|2", "full_name": None, "username": "riya_k",
     "article_score": 0, "course_score": 50, "consistency_score": 0, "fin_stars": 0, "fin_score": 50, "rank": 2},
    {"email": "x.y@college.edu", "user_sub": "g|3",  # before migration 017: no full_name key at all
     "article_score": 0, "course_score": 10, "consistency_score": 0, "fin_stars": 0, "fin_score": 10, "rank": 3},
]


@pytest.fixture
def board(monkeypatch):
    monkeypatch.setattr(home_service, "get_leaderboard", lambda timeframe="all_time": [dict(r) for r in ROWS])
    yield TestClient(app)
    app.dependency_overrides.clear()


def as_user(email):
    async def dep():
        return AuthUser(email=email, sub="g|x", roles=["User"]) if email else None
    return dep


def test_public_name_formats():
    assert public_name({"full_name": "Anish Pujari"}) == "Anish P."
    assert public_name({"full_name": "  Mohammed  Abdul Rahman "}) == "Mohammed R."
    assert public_name({"full_name": "Riya"}) == "Riya"
    assert public_name({"full_name": "", "username": "arjun_7"}) == "@arjun_7"
    assert public_name({"email": "someone@gmail.com"}) == "FinEd learner"


def test_leaderboard_sends_no_addresses_or_ids(board):
    app.dependency_overrides[get_optional_current_user] = as_user(None)
    res = board.get("/api/home/leaderboard")
    assert res.status_code == 200
    body = res.json()
    raw = json.dumps(body)
    for r in ROWS:
        assert r["email"].lower() not in raw.lower()
        assert r["user_sub"] not in raw
    assert [e["name"] for e in body] == ["Anish P.", "@riya_k", "FinEd learner"]
    assert all(e["me"] is False for e in body)
    # older site builds read entry.email; it must be there and be the public name
    assert all(e["email"] == e["name"] for e in body)
    assert [e["fin_score"] for e in body] == [100, 50, 10]
    assert [e["rank"] for e in body] == [1, 2, 3]


def test_leaderboard_marks_only_the_callers_row(board):
    app.dependency_overrides[get_optional_current_user] = as_user("riya@example.com")
    body = board.get("/api/home/leaderboard?timeframe=this_week").json()
    assert [e["me"] for e in body] == [False, True, False]


class _Query:
    def __init__(self, store, fail_on=None):
        self.store, self.fail_on, self.cols = store, fail_on, None

    def select(self, cols):
        self.cols = cols
        return self

    def update(self, fields):
        self.store.setdefault("updates", []).append(dict(fields))
        if self.fail_on and self.fail_on in fields:
            raise RuntimeError(f"column users.{self.fail_on} does not exist")
        return self

    def eq(self, *a):
        return self

    def execute(self):
        if self.cols is not None:
            self.store.setdefault("selects", []).append(self.cols)
            if self.fail_on and self.fail_on in self.cols:
                raise RuntimeError(f"column users.{self.fail_on} does not exist")
        return type("R", (), {"data": [{"email": "a@b.c"}]})()


class _Fake:
    def __init__(self, fail_on=None):
        self.store, self.fail_on = {}, fail_on

    def from_(self, table):
        assert table == "users"
        return _Query(self.store, self.fail_on)


def test_board_query_works_before_and_after_migration(monkeypatch):
    before = _Fake(fail_on="full_name")
    monkeypatch.setattr(user_repo_module, "supabase", before)
    assert user_repo.get_all_for_leaderboard() == [{"email": "a@b.c"}]
    assert "full_name" in before.store["selects"][0] and "full_name" not in before.store["selects"][1]

    after = _Fake()
    monkeypatch.setattr(user_repo_module, "supabase", after)
    assert user_repo.get_all_for_leaderboard() == [{"email": "a@b.c"}]
    assert len(after.store["selects"]) == 1 and "full_name" in after.store["selects"][0]


def test_saving_the_name_never_fails_the_request(monkeypatch):
    monkeypatch.setattr(user_repo, "get_profile", lambda email, user_sub=None, name=None: {"email": email})
    for fake in (_Fake(fail_on="full_name"), _Fake()):  # before / after migration 017
        monkeypatch.setattr(user_repo_module, "supabase", fake)
        assert user_repo.update_profile("a@b.c", {"full_name": "Anish Pujari"}) == {"email": "a@b.c"}
        assert fake.store["updates"][0] == {"full_name": "Anish Pujari"}
    user_repo._PROFILE_STORE.pop("a@b.c", None)


def test_profile_edits_do_not_touch_the_name(monkeypatch):
    monkeypatch.setattr(user_repo, "get_profile", lambda email, user_sub=None, name=None: {"email": email})
    fake = _Fake()
    monkeypatch.setattr(user_repo_module, "supabase", fake)
    user_repo.update_profile("a@b.c", {"username": "anish", "bio": "hi"})
    assert fake.store["updates"] == [{"username": "anish", "bio": "hi"}]
    user_repo._PROFILE_STORE.pop("a@b.c", None)


@pytest.mark.parametrize("name, status, saved", [
    ("  Anish   Pujari ", 200, "Anish Pujari"),
    ("anish@gmail.com", 422, None),
    ("see https://x.y", 422, None),
    ("x" * 61, 422, None),
    ("   ", 422, None),
])
def test_patch_full_name_is_checked(monkeypatch, name, status, saved):
    seen = {}

    def fake_update(email, fields, user_sub=None):
        seen.update(fields)
        return {"email": email, "display_name": "A", "username": "a", "career_stage": "Student",
                "financial_level": "Beginner", "bio": "b"}

    monkeypatch.setattr(user_repo, "update_profile", fake_update)
    app.dependency_overrides[get_current_user] = as_user("a@b.c")
    try:
        res = TestClient(app).patch("/api/v1/users/me", json={"full_name": name})
    finally:
        app.dependency_overrides.clear()
    assert res.status_code == status
    assert seen.get("full_name") == saved
