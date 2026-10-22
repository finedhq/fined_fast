# Phone notifications through Firebase Cloud Messaging (HTTP v1), for the mobile app (Phase 5).
#
# Switched on by the FIREBASE_SERVICE_ACCOUNT setting: the service account JSON from
# Firebase console -> Project settings -> Service accounts -> Generate new private key, pasted as
# one line. Without it, notify() does nothing, so the website and backend work exactly as before.
#
# Sending runs in a small background pool: it never slows down or breaks the request that
# created the notification.
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor

import httpx

from app.config import settings
from app.repositories.push_repo import push_repo

logger = logging.getLogger(__name__)

FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
ANDROID_CHANNEL = "fined_updates"  # created by the app (src/app/push.js)


class PushService:

    def __init__(self):
        self._credentials = None
        self._project_id = None
        self._lock = threading.Lock()
        self._pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="push")

    @property
    def enabled(self) -> bool:
        return bool(settings.FIREBASE_SERVICE_ACCOUNT)

    def notify(self, email: str, body: str, title: str = "FinEd", route: str = "/notifications"):
        """Send a phone notification to every phone signed in as this user. Returns at once."""
        if not self.enabled or not email or not body:
            return
        self._pool.submit(self._send_safely, email, title, body, route)

    def _send_safely(self, email: str, title: str, body: str, route: str):
        try:
            self.send_now(email, title, body, route)
        except Exception:
            logger.exception("Push notification failed")

    def _access_token(self) -> str:
        # Imported here so the backend starts even where google-auth isn't installed yet.
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account

        with self._lock:
            if self._credentials is None:
                info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT)
                self._credentials = service_account.Credentials.from_service_account_info(info, scopes=[FCM_SCOPE])
                self._project_id = info["project_id"]
            if not self._credentials.valid:
                self._credentials.refresh(Request())
            return self._credentials.token

    @staticmethod
    def message(token: str, title: str, body: str, route: str) -> dict:
        return {
            "message": {
                "token": token,
                "notification": {"title": title, "body": body},
                "data": {"route": route},  # the app opens this screen when tapped
                "android": {
                    "priority": "high",
                    "notification": {"channel_id": ANDROID_CHANNEL, "icon": "ic_stat_fined", "color": "#4100BC"},
                },
            }
        }

    @staticmethod
    def is_dead_token(response: httpx.Response) -> bool:
        """Firebase says this phone no longer exists (app uninstalled, data cleared...)."""
        if response.status_code not in (400, 404):
            return False
        try:
            error = response.json().get("error", {})
        except ValueError:
            return False
        codes = {d.get("errorCode") for d in error.get("details", []) if isinstance(d, dict)}
        if "UNREGISTERED" in codes:
            return True
        return "INVALID_ARGUMENT" in codes and "registration token" in str(error.get("message", "")).lower()

    def send_now(self, email: str, title: str, body: str, route: str = "/notifications") -> int:
        """Send synchronously; returns how many phones accepted it. Dead tokens are removed."""
        tokens = push_repo.tokens_for(email)
        if not tokens:
            return 0
        access_token = self._access_token()
        url = f"https://fcm.googleapis.com/v1/projects/{self._project_id}/messages:send"
        sent, dead = 0, []
        with httpx.Client(timeout=10) as client:
            for token in tokens:
                response = client.post(
                    url,
                    json=self.message(token, title, body, route),
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if response.status_code == 200:
                    sent += 1
                elif self.is_dead_token(response):
                    dead.append(token)
                else:
                    logger.warning("FCM send failed: %s %s", response.status_code, response.text[:300])
        push_repo.remove_tokens(dead)
        return sent


push_service = PushService()
