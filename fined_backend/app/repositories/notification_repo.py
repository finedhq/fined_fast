# Database queries for user notification alerts
from app.integrations.supabase_client import supabase


class NotificationRepository:

    def send(self, email: str, content: str):
        """Insert a new notification — equivalent to old notifications.js sendNotification()"""
        supabase.from_("notifications").insert([{
            "email": email,
            "content": content,
            "seen": False
        }]).execute()
        
    def get_all(self, email: str) -> list:
        res = supabase.from_("notifications").select("*").eq("email", email)\
            .order("created_at", desc=True).execute()
        return res.data or []

    def has_unseen(self, email: str) -> bool:
        res = supabase.from_("notifications").select("id").eq("email", email)\
            .eq("seen", False).limit(1).execute()
        return len(res.data or []) > 0

    def mark_all_seen(self, email: str):
        supabase.from_("notifications").update({"seen": True})\
            .eq("email", email).eq("seen", False).execute()

notification_repo = NotificationRepository()
