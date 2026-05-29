# Notification delivery and retrieval logic
from app.repositories.notification_repo import notification_repo


class NotificationService:

    def send(self, email: str, content: str):
        """
        Create a notification for a user.
        Called by other services — not directly by routes.
        """
        notification_repo.send(email, content)

    def get_all(self, email: str) -> list:
        """Fetch all notifications for a user — newest first"""
        return notification_repo.get_all(email)

    def has_unseen(self, email: str) -> bool:
        """Used by frontend to show the red dot on the bell icon"""
        return notification_repo.has_unseen(email)

    def mark_all_seen(self, email: str):
        """Called when user opens the notification panel"""
        notification_repo.mark_all_seen(email)


notification_service = NotificationService()
