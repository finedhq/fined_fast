# Database queries for user course progress
from app.integrations.supabase_client import supabase


class ProgressRepository:

    def get_course_progress(self, email: str, course_id: str) -> dict | None:
        res = supabase.from_("userCourses").select("*")\
            .eq("email", email).eq("course_id", course_id).maybe_single().execute()
        return res.data

    def get_all_progress(self, email: str) -> list:
        res = supabase.from_("userCourses").select("*").eq("email", email).execute()
        return res.data or []

    def get_ongoing(self, email: str) -> dict | None:
        """Most recently updated in-progress course"""
        res = supabase.from_("userCourses").select("*")\
            .eq("email", email).eq("completed", False)\
            .order("updated_at", desc=True).limit(1).execute()
        return res.data[0] if res.data else None

    def upsert_progress(self, email: str, course_id: str, fields: dict):
        fields["email"] = email
        fields["course_id"] = course_id
        supabase.from_("userCourses").upsert(
            [fields], on_conflict="email,course_id"
        ).execute()

    def get_completed_cards(self, email: str, course_id: str) -> list:
        res = supabase.from_("userCourses").select("completed_cards")\
            .eq("email", email).eq("course_id", course_id).maybe_single().execute()
        return res.data.get("completed_cards", []) if res.data else []


progress_repo = ProgressRepository()
