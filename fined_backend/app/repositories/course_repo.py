# Database queries for courses, modules, and cards
from app.integrations.supabase_client import supabase


class CourseRepository:


    def get_all(self) -> list:
        res = supabase.from_("courses").select("*").order("created_at", desc=True).execute()
        return res.data or []

    def get_by_id(self, course_id: str) -> dict | None:
        res = supabase.from_("courses").select("*").eq("id", course_id).maybe_single().execute()
        return res.data

    def insert(self, title: str, description: str, thumbnail_url: str = "") -> dict:
        res = supabase.from_("courses").insert([{
            "title": title,
            "description": description,
            "thumbnail_url": thumbnail_url
        }]).select().single().execute()
        return res.data

    def delete(self, course_id: str):
        supabase.from_("courses").delete().eq("id", course_id).execute()


    def get_modules(self, course_id: str) -> list:
        res = supabase.from_("modules").select("*").eq("course_id", course_id)\
            .order("order_index").execute()
        return res.data or []

    def insert_module(self, course_id: str, title: str, description: str, order_index: int) -> dict:
        res = supabase.from_("modules").insert([{
            "course_id": course_id,
            "title": title,
            "description": description,
            "order_index": order_index
        }]).select().single().execute()
        return res.data

    def delete_module(self, module_id: str):
        supabase.from_("modules").delete().eq("id", module_id).execute()


    def get_cards(self, module_id: str) -> list:
        res = supabase.from_("cards").select("*").eq("module_id", module_id)\
            .order("order_index").execute()
        return res.data or []

    def get_card(self, card_id: str) -> dict | None:
        res = supabase.from_("cards").select("*").eq("card_id", card_id).maybe_single().execute()
        return res.data

    def insert_card(self, module_id: str, card_data: dict) -> dict:
        card_data["module_id"] = module_id
        res = supabase.from_("cards").insert([card_data]).select().single().execute()
        return res.data

    def delete_card(self, card_id: str):
        supabase.from_("cards").delete().eq("card_id", card_id).execute()


course_repo = CourseRepository()
