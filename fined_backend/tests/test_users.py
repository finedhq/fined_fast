import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user, AuthUser

@pytest.fixture
def client():
    # Mock authentication dependency
    async def mock_user():
        return AuthUser(
            email="karulerashi@gmail.com",
            sub="google-oauth2|111993529629681883817",
            roles=["User"]
        )

    app.dependency_overrides[get_current_user] = mock_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_get_user_profile(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "karulerashi@gmail.com"
    assert "display_name" in data
    assert "full_name" in data
    assert data["full_name"] == data["display_name"]
    assert "username" in data
    assert "career_stage" in data
    assert "financial_level" in data
    assert "bio" in data
    assert "location" in data
    assert data["location"] == "Nagpur, IN"
    assert "fin_score" in data
    assert "finscore" in data
    assert data["finscore"] == data["fin_score"]
    assert "fin_stars" in data
    assert "finstars" in data
    assert data["finstars"] == data["fin_stars"]
    assert "streak_count" in data
    assert "streak" in data
    assert data["streak"] == data["streak_count"]
    assert "ongoing_course" in data
    assert "activity_map" in data
    assert isinstance(data["activity_map"], dict)
    assert len(data["consistency_grid"]) == 28


def test_update_user_profile(client):
    update_payload = {
        "username": "rashi_test",
        "career_stage": "Student",
        "financial_level": "Beginner (Level 1) - Starting with basics",
        "bio": "Testing user profile updates",
        "location": "Mumbai, IN"
    }
    response = client.patch("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "rashi_test"
    assert data["career_stage"] == "Student"
    assert data["bio"] == "Testing user profile updates"
    assert data["location"] == "Mumbai, IN"


def test_update_invalid_username(client):
    # Username with special characters is invalid
    response = client.patch("/api/v1/users/me", json={"username": "invalid@user!"})
    assert response.status_code == 422


def test_new_user_profile_autocreation():
    # Test that a new user with Auth0 claims gets auto-created/initialized
    async def mock_new_user():
        return AuthUser(
            email="newstudent@fined.org",
            sub="auth0|newstudent987",
            roles=["User"],
            name="New Student"
        )

    app.dependency_overrides[get_current_user] = mock_new_user
    new_client = TestClient(app)
    try:
        response = new_client.get("/api/v1/users/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newstudent@fined.org"
        assert data["full_name"] == "New Student"
        assert data["display_name"] == "New Student"
        assert "username" in data
        assert data["career_stage"] == "Student"
        assert data["streak"] >= 0
        assert "activity_map" in data
        assert isinstance(data["activity_map"], dict)
    finally:
        app.dependency_overrides.clear()


def test_fin_score_four_column_sum_calculation(monkeypatch):
    from app.repositories.user_repo import user_repo

    mock_user = {
        "id": "mock-uuid-123",
        "email": "math_test@fined.org",
        "user_sub": "auth0|mockmath123",
        "article_score": 120,
        "expense_score": 80,
        "course_score": 150,
        "consistency_score": 50,
        "fin_stars": 25,
        "streak_count": 9,
    }

    monkeypatch.setattr(user_repo, "get_by_email", lambda em: mock_user if em == "math_test@fined.org" else None)

    profile = user_repo.get_profile("math_test@fined.org", user_sub="auth0|mockmath123")
    assert profile["fin_score"] == 400
    assert profile["finscore"] == 400
    assert profile["fin_stars"] == 25
    assert profile["finstars"] == 25
    assert profile["streak_count"] == 9
    assert profile["streak"] == 9


def test_fin_score_handles_null_columns(monkeypatch):
    from app.repositories.user_repo import user_repo

    mock_user_nulls = {
        "id": "mock-uuid-456",
        "email": "nulls_test@fined.org",
        "user_sub": "auth0|nulls123",
        "article_score": None,
        "expense_score": None,
        "course_score": None,
        "consistency_score": None,
        "fin_stars": None,
        "streak_count": None,
    }

    monkeypatch.setattr(user_repo, "get_by_email", lambda em: mock_user_nulls if em == "nulls_test@fined.org" else None)

    profile = user_repo.get_profile("nulls_test@fined.org", user_sub="auth0|nulls123")
    assert profile["fin_score"] == 0
    assert profile["finscore"] == 0
    assert profile["fin_stars"] == 0
    assert profile["finstars"] == 0
    assert profile["streak_count"] == 0
    assert profile["streak"] == 0


def test_fin_stars_accrued_from_course_completion(monkeypatch):
    from app.repositories.user_repo import user_repo

    mock_user = {
        "id": "mock-uuid-stars1",
        "email": "stars_test@fined.org",
        "user_sub": "auth0|stars1",
        "course_score": 40,
        "fin_stars": 0,
        "streak_count": 2,
    }

    monkeypatch.setattr(user_repo, "get_by_email", lambda em: mock_user if em == "stars_test@fined.org" else None)
    monkeypatch.setattr(user_repo, "update_fields", lambda em, fields: None)

    profile = user_repo.get_profile("stars_test@fined.org", user_sub="auth0|stars1")
    # 40 course_score = 2 modules * 10 stars = 20 fin_stars
    assert profile["fin_stars"] >= 20
    assert profile["finstars"] >= 20


def test_fin_stars_never_decreases(monkeypatch):
    from app.repositories.user_repo import user_repo

    mock_user = {
        "id": "mock-uuid-stars2",
        "email": "highstars@fined.org",
        "user_sub": "auth0|stars2",
        "course_score": 0,
        "fin_stars": 75,
        "streak_count": 5,
    }

    monkeypatch.setattr(user_repo, "get_by_email", lambda em: mock_user if em == "highstars@fined.org" else None)
    monkeypatch.setattr(user_repo, "update_fields", lambda em, fields: None)

    profile = user_repo.get_profile("highstars@fined.org", user_sub="auth0|stars2")
    assert profile["fin_stars"] == 75
    assert profile["finstars"] == 75



