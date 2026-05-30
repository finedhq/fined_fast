# Database queries for user course progress
from app.integrations.supabase_client import supabase


class ProgressRepository:

    def get_course_progress(self, email: str, course_id: str) -> dict | None:
        res = supabase.from_("userCourses").select("*")\
            .eq("email", email).eq("course_id", course_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def get_all_progress(self, email: str) -> list:
        res = supabase.from_("userCourses").select("*").eq("email", email).execute()
        return res.data or []

    def get_ongoing(self, email: str) -> dict | None:
        """Most recently updated in-progress course"""
        res = supabase.from_("users").select("ongoing_course_id").eq("email", email).limit(1).execute()
        if res.data and res.data[0].get("ongoing_course_id"):
            return {"course_id": res.data[0]["ongoing_course_id"]}
        return None

    def upsert_progress(self, email: str, course_id: str, fields: dict):
        fields["email"] = email
        fields["course_id"] = course_id
        supabase.from_("userCourses").upsert(
            [fields], on_conflict="email,course_id"
        ).execute()

    def get_completed_cards(self, email: str, course_id: str) -> list:
        res = supabase.from_("userCourses").select("completed_cards")\
            .eq("email", email).eq("course_id", course_id).limit(1).execute()
        return res.data[0].get("completed_cards", []) if res and res.data else []


progress_repo = ProgressRepository()
