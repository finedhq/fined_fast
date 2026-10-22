# Database queries for phone push notification tokens (table: push_tokens, migration 004)
from datetime import datetime, timezone

from app.integrations.supabase_client import supabase


class PushRepository:

    def save(self, email: str, token: str, platform: str):
        """Remember a phone for this account. The same phone signing in as someone else moves over."""
        supabase.from_("push_tokens").upsert(
            [{
                "token": token,
                "email": email,
                "platform": platform,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }],
            on_conflict="token",
        ).execute()

    def remove(self, email: str, token: str):
        supabase.from_("push_tokens").delete().eq("token", token).eq("email", email).execute()

    def tokens_for(self, email: str) -> list[str]:
        res = supabase.from_("push_tokens").select("token").eq("email", email).execute()
        return [row["token"] for row in (res.data or [])]

    def remove_tokens(self, tokens: list[str]):
        if tokens:
            supabase.from_("push_tokens").delete().in_("token", tokens).execute()


push_repo = PushRepository()
