# Account deletion (Phase 6): the user's data first, then their Auth0 login.
#
# Order matters: if the Auth0 step fails, the data is already gone and the user can tap
# "Delete account" again (still signed in) to finish. If it were the other way round, a failure
# could leave data behind for a login that no longer exists.
import logging
from urllib.parse import quote

import httpx

from app.config import settings
from app.repositories.account_repo import account_repo
from app.repositories.article_repo import article_repo

logger = logging.getLogger(__name__)


class AccountDeletionUnavailable(Exception):
    """Auth0 Management API isn't configured, so a login couldn't be removed."""


class AccountService:

    @property
    def auth0_ready(self) -> bool:
        return bool(settings.AUTH0_MGMT_CLIENT_ID and settings.AUTH0_MGMT_CLIENT_SECRET)

    @staticmethod
    def is_real_login(sub: str) -> bool:
        # Auth0 ids look like "google-oauth2|1234" or "auth0|abcd"; local development users don't.
        return bool(sub) and "|" in sub

    def _mgmt_domain(self) -> str:
        return settings.AUTH0_MGMT_DOMAIN or settings.AUTH0_DOMAIN

    def _delete_auth0_user(self, sub: str):
        domain = self._mgmt_domain()
        with httpx.Client(timeout=15) as client:
            token_res = client.post(
                f"https://{domain}/oauth/token",
                json={
                    "grant_type": "client_credentials",
                    "client_id": settings.AUTH0_MGMT_CLIENT_ID,
                    "client_secret": settings.AUTH0_MGMT_CLIENT_SECRET,
                    "audience": f"https://{domain}/api/v2/",
                },
            )
            token_res.raise_for_status()
            access_token = token_res.json()["access_token"]
            res = client.delete(
                f"https://{domain}/api/v2/users/{quote(sub, safe='')}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if res.status_code not in (204, 404):  # 404: already deleted
                res.raise_for_status()

    def _refresh_ratings(self, article_ids: list[str]):
        # Their ratings are gone, so the articles' average ratings are recalculated without them.
        for article_id in set(article_ids):
            try:
                ratings = [r["rating"] for r in article_repo.get_all_ratings_for_article(article_id)]
                article_repo.update_avg_rating(article_id, sum(ratings) / len(ratings) if ratings else 0)
            except Exception:
                logger.exception("Couldn't refresh rating for article %s", article_id)

    def delete_account(self, email: str, sub: str) -> None:
        real_login = self.is_real_login(sub)
        if real_login and not self.auth0_ready:
            # Refuse before touching anything: deleting data but leaving the login would be half a deletion.
            raise AccountDeletionUnavailable()

        rated = account_repo.rated_article_ids(email)
        account_repo.delete_user_data(email)
        self._refresh_ratings(rated)

        if real_login:
            self._delete_auth0_user(sub)
        logger.info("Account deleted (%s)", "data + login" if real_login else "data only")


account_service = AccountService()
