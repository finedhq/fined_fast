# Tests for the mobile app's backend pieces: phone notification tokens, sending through Firebase,
# and account deletion. Database, Firebase and Auth0 are replaced with fakes, so these run offline.
import json

import httpx
import pytest
from fastapi.testclient import TestClient
from postgrest.exceptions import APIError

from app.dependencies import AuthUser, get_current_user
from app.main import app
from app.repositories import account_repo as account_repo_module
from app.repositories.account_repo import USER_TABLES
from app.services import account_service as account_service_module
from app.services import push_service as push_service_module
from app.services.account_service import AccountDeletionUnavailable, account_service
from app.services.push_service import PushService

USER = AuthUser(email="student@example.com", sub="google-oauth2|123", roles=["User"])


@pytest.fixture
def client():
    async def signed_in():
        return USER

    app.dependency_overrides[get_current_user] = signed_in
    yield TestClient(app)
    app.dependency_overrides.clear()


class FakePushRepo:
    def __init__(self, tokens=None):
        self.saved, self.removed, self.dropped = [], [], []
        self.tokens = tokens or []

    def save(self, email, token, platform):
        self.saved.append((email, token, platform))

    def remove(self, email, token):
        self.removed.append((email, token))

    def tokens_for(self, email):
        return list(self.tokens)

    def remove_tokens(self, tokens):
        self.dropped.extend(tokens)


# ── Push token endpoints ───────────────────────────────────────────────────

def test_save_push_token(client, monkeypatch):
    repo = FakePushRepo()
    monkeypatch.setattr("app.routes.users.push_repo", repo)
    res = client.post("/api/v1/users/me/push-tokens", json={"token": "fcm-token-abcdef", "platform": "android"})
    assert res.status_code == 204
    assert repo.saved == [("student@example.com", "fcm-token-abcdef", "android")]


def test_push_token_rejects_junk(client, monkeypatch):
    monkeypatch.setattr("app.routes.users.push_repo", FakePushRepo())
    assert client.post("/api/v1/users/me/push-tokens", json={"token": "x"}).status_code == 422
    assert client.post("/api/v1/users/me/push-tokens", json={"token": "fcm-token-abcdef", "platform": "web"}).status_code == 422


def test_remove_push_token_only_for_this_user(client, monkeypatch):
    repo = FakePushRepo()
    monkeypatch.setattr("app.routes.users.push_repo", repo)
    res = client.request("DELETE", "/api/v1/users/me/push-tokens", json={"token": "fcm-token-abcdef"})
    assert res.status_code == 204
    assert repo.removed == [("student@example.com", "fcm-token-abcdef")]


# ── Sending through Firebase ───────────────────────────────────────────────

def test_notify_does_nothing_without_firebase(monkeypatch):
    monkeypatch.setattr(push_service_module.settings, "FIREBASE_SERVICE_ACCOUNT", None)
    service = PushService()
    submitted = []
    monkeypatch.setattr(service._pool, "submit", lambda *a: submitted.append(a))
    service.notify("student@example.com", "You're on a 3-day streak!")
    assert submitted == []


def test_message_shape():
    msg = PushService.message("tok", "FinEd", "Streak!", "/notifications")["message"]
    assert msg["token"] == "tok"
    assert msg["notification"] == {"title": "FinEd", "body": "Streak!"}
    assert msg["data"] == {"route": "/notifications"}  # FCM data values must be strings
    assert msg["android"]["notification"]["channel_id"] == "fined_updates"


def _fcm_error(status, code, message="error"):
    body = {"error": {"code": status, "message": message, "details": [{"@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError", "errorCode": code}]}}
    return httpx.Response(status, content=json.dumps(body))


def test_dead_token_detection():
    assert PushService.is_dead_token(_fcm_error(404, "UNREGISTERED"))
    assert PushService.is_dead_token(_fcm_error(400, "INVALID_ARGUMENT", "The registration token is not a valid FCM registration token"))
    assert not PushService.is_dead_token(_fcm_error(400, "INVALID_ARGUMENT", "Invalid JSON payload"))
    assert not PushService.is_dead_token(_fcm_error(503, "UNAVAILABLE"))
    assert not PushService.is_dead_token(httpx.Response(200, content=b"{}"))


def test_send_now_sends_to_each_phone_and_drops_dead_ones(monkeypatch):
    repo = FakePushRepo(tokens=["good-token-1", "dead-token-2"])
    monkeypatch.setattr(push_service_module, "push_repo", repo)
    service = PushService()
    service._project_id = "fined-test"
    monkeypatch.setattr(service, "_access_token", lambda: "google-access-token")

    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        token = json.loads(request.content)["message"]["token"]
        if token == "dead-token-2":
            return _fcm_error(404, "UNREGISTERED")
        return httpx.Response(200, json={"name": "projects/fined-test/messages/1"})

    real_client = httpx.Client
    monkeypatch.setattr(push_service_module.httpx, "Client", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))

    assert service.send_now("student@example.com", "FinEd", "Streak!") == 1
    assert [str(c.url) for c in calls] == ["https://fcm.googleapis.com/v1/projects/fined-test/messages:send"] * 2
    assert calls[0].headers["Authorization"] == "Bearer google-access-token"
    assert repo.dropped == ["dead-token-2"]


def test_in_app_notification_also_goes_to_phone(monkeypatch):
    from app.services import notification_service as ns

    stored, pushed = [], []
    monkeypatch.setattr(ns.notification_repo, "send", lambda email, content: stored.append((email, content)))
    monkeypatch.setattr(ns.push_service, "notify", lambda email, content: pushed.append((email, content)))
    ns.notification_service.send("student@example.com", "You're on a 3-day streak!")
    assert stored == pushed == [("student@example.com", "You're on a 3-day streak!")]


# ── Account deletion ───────────────────────────────────────────────────────

class FakeTable:
    def __init__(self, log, name):
        self.log, self.name, self.action = log, name, None

    def delete(self):
        self.action = "delete"
        return self

    def select(self, *_):
        self.action = "select"
        return self

    def eq(self, column, value):
        self.log.append((self.action, self.name, column, value))
        return self

    def execute(self):
        return type("Res", (), {"data": [{"article_id": "a1"}] if self.name == "article_ratings" and self.action == "select" else []})()


class FakeSupabase:
    def __init__(self):
        self.log = []

    def from_(self, name):
        return FakeTable(self.log, name)


def test_delete_user_data_clears_every_table_users_last(monkeypatch):
    fake = FakeSupabase()
    monkeypatch.setattr(account_repo_module, "supabase", fake)
    account_repo_module.account_repo.delete_user_data("student@example.com")
    deleted = [name for action, name, column, value in fake.log if action == "delete"]
    assert deleted == [*USER_TABLES, "users"]
    assert all(column == "email" and value == "student@example.com" for _, _, column, value in fake.log)


class FailingSupabase(FakeSupabase):
    """Like FakeSupabase, but deleting from one table raises the given PostgREST error code."""

    def __init__(self, table, code):
        super().__init__()
        self.table, self.code = table, code

    def from_(self, name):
        table = super().from_(name)
        if name == self.table:
            def execute():
                raise APIError({"message": "boom", "code": self.code, "hint": None, "details": None})
            table.execute = execute
        return table


def test_delete_user_data_skips_a_table_the_database_does_not_have(monkeypatch):
    fake = FailingSupabase("reward_notifications", "PGRST205")  # "Could not find the table"
    monkeypatch.setattr(account_repo_module, "supabase", fake)
    cleared = account_repo_module.account_repo.delete_user_data("student@example.com")
    deleted = [name for action, name, *_ in fake.log if action == "delete"]
    assert deleted == [*USER_TABLES, "users"]  # every table was tried, users still last
    assert "reward_notifications" not in cleared and cleared[-1] == "users"


def test_delete_user_data_stops_on_any_other_database_error(monkeypatch):
    fake = FailingSupabase("userCourses", "42501")  # e.g. permission denied
    monkeypatch.setattr(account_repo_module, "supabase", fake)
    with pytest.raises(APIError):
        account_repo_module.account_repo.delete_user_data("student@example.com")
    deleted = [name for action, name, *_ in fake.log if action == "delete"]
    assert "users" not in deleted  # the account itself is kept, so the user can try again


@pytest.fixture
def deletion(monkeypatch):
    steps = []
    monkeypatch.setattr(account_service_module.account_repo, "rated_article_ids", lambda email: ["a1"])
    monkeypatch.setattr(account_service_module.account_repo, "delete_user_data", lambda email: steps.append(("data", email)))
    monkeypatch.setattr(account_service, "_refresh_ratings", lambda ids: steps.append(("ratings", ids)))
    monkeypatch.setattr(account_service, "_delete_auth0_user", lambda sub: steps.append(("login", sub)))
    return steps


def test_delete_account_removes_data_then_login(monkeypatch, deletion):
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_ID", "id")
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_SECRET", "secret")
    account_service.delete_account("student@example.com", "google-oauth2|123")
    assert deletion == [("data", "student@example.com"), ("ratings", ["a1"]), ("login", "google-oauth2|123")]


def test_delete_account_refused_before_touching_data_without_auth0_setup(monkeypatch, deletion):
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_ID", None)
    with pytest.raises(AccountDeletionUnavailable):
        account_service.delete_account("student@example.com", "google-oauth2|123")
    assert deletion == []


def test_local_dev_user_is_deleted_without_auth0(monkeypatch, deletion):
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_ID", None)
    account_service.delete_account("admin@myfined.com", "dev-admin")
    assert ("login", "dev-admin") not in deletion
    assert deletion[0] == ("data", "admin@myfined.com")


def test_delete_endpoint(client, monkeypatch):
    seen = []
    monkeypatch.setattr("app.routes.users.account_service.delete_account", lambda email, sub: seen.append((email, sub)))
    assert client.delete("/api/v1/users/me").status_code == 204
    assert seen == [("student@example.com", "google-oauth2|123")]


def test_delete_endpoint_explains_when_unavailable(client, monkeypatch):
    def unavailable(email, sub):
        raise AccountDeletionUnavailable()

    monkeypatch.setattr("app.routes.users.account_service.delete_account", unavailable)
    res = client.delete("/api/v1/users/me")
    assert res.status_code == 503
    assert "email us" in res.json()["detail"]


def test_auth0_management_calls(monkeypatch):
    monkeypatch.setattr(account_service_module.settings, "AUTH0_DOMAIN", "login.myfined.com")
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_DOMAIN", "fined.eu.auth0.com")
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_ID", "id")
    monkeypatch.setattr(account_service_module.settings, "AUTH0_MGMT_CLIENT_SECRET", "secret")
    calls = []

    def handler(request: httpx.Request):
        calls.append((request.method, str(request.url)))
        if request.url.path == "/oauth/token":
            assert json.loads(request.content)["audience"] == "https://fined.eu.auth0.com/api/v2/"
            return httpx.Response(200, json={"access_token": "mgmt"})
        assert request.headers["Authorization"] == "Bearer mgmt"
        return httpx.Response(204)

    real_client = httpx.Client
    monkeypatch.setattr(account_service_module.httpx, "Client", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    account_service._delete_auth0_user("google-oauth2|123")
    assert calls == [
        ("POST", "https://fined.eu.auth0.com/oauth/token"),
        ("DELETE", "https://fined.eu.auth0.com/api/v2/users/google-oauth2%7C123"),
    ]
