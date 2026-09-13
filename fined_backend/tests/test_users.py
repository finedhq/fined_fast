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
    assert "username" in data
    assert "career_stage" in data
    assert "financial_level" in data
    assert "bio" in data
    assert "fin_score" in data
    assert "fin_stars" in data
    assert "ongoing_course" in data
    assert len(data["consistency_grid"]) == 28


def test_update_user_profile(client):
    update_payload = {
        "username": "rashi_test",
        "career_stage": "Student",
        "financial_level": "Beginner (Level 1) - Starting with basics",
        "bio": "Testing user profile updates"
    }
    response = client.patch("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "rashi_test"
    assert data["career_stage"] == "Student"
    assert data["bio"] == "Testing user profile updates"


def test_update_invalid_username(client):
    # Username with special characters is invalid
    response = client.patch("/api/v1/users/me", json={"username": "invalid@user!"})
    assert response.status_code == 422
