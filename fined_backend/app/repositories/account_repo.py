# Database side of account deletion (Phase 6: Google Play requires in-app account deletion).
# Removes every row that belongs to one person. Safe to run again: deleting what's already gone is fine.
import logging

from postgrest.exceptions import APIError

from app.integrations.supabase_client import supabase

logger = logging.getLogger(__name__)

# Tables holding a person's data, keyed by their account email. `users` goes last so a failure
# part-way leaves the account in place and the user can simply try again.
USER_TABLES = [
    "push_tokens",
    "notifications",
    "reward_notifications",
    "userCourses",
    "finScoreLogs",
    "certificates",
    "article_ratings",
    "user_feedbacks",
    "contact_us",
    "newsletter_gmails",
    "waitlist_emails",
]


class AccountRepository:

    def rated_article_ids(self, email: str) -> list[str]:
        res = supabase.from_("article_ratings").select("article_id").eq("email", email).execute()
        return [row["article_id"] for row in (res.data or [])]

    def delete_user_data(self, email: str) -> list[str]:
        """Delete everything for this email; returns the tables cleared."""
        cleared = []
        for table in USER_TABLES:
            try:
                supabase.from_(table).delete().eq("email", email).execute()
                cleared.append(table)
            except APIError as error:
                # A table this database doesn't have (e.g. the practice copy lags behind live)
                # holds nothing to delete. Any other error still stops the deletion.
                if getattr(error, "code", None) != "PGRST205":
                    raise
                logger.warning("Account deletion: table %s doesn't exist here, skipped", table)
        supabase.from_("users").delete().eq("email", email).execute()
        return [*cleared, "users"]


account_repo = AccountRepository()
