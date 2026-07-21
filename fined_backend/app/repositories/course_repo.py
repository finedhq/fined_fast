# Database queries for courses, modules, and cards
from app.integrations.supabase_client import supabase


class CourseRepository:


    def get_all(self) -> list:
        res = supabase.from_("courses").select("*").order("created_at", desc=True).execute()
        return res.data or []

    def get_by_id(self, course_id: str) -> dict | None:
        res = supabase.from_("courses").select("*").eq("id", course_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def get_by_slug(self, slug: str) -> dict | None:
        res = supabase.from_("courses").select("*").eq("slug", slug).limit(1).execute()
        return res.data[0] if res and res.data else None

    def insert(self, title: str, description: str, thumbnail_url: str = "", slug: str = "") -> dict:
        res = supabase.from_("courses").insert([{
            "title": title,
            "description": description,
            "thumbnail_url": thumbnail_url,
            "slug": slug
        }]).execute()
        return res.data[0] if res.data else {}

    def delete(self, course_id: str):
        supabase.from_("courses").delete().eq("id", course_id).execute()


    def get_modules(self, course_id: str) -> list:
        res = supabase.from_("modules").select("*").eq("course_id", course_id)\
            .order("order_index").execute()
        return res.data or []

    def get_module_by_id(self, module_id: str) -> dict | None:
        res = supabase.from_("modules").select("*").eq("id", module_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def get_module_by_slug(self, slug: str, course_id: str = None) -> dict | None:
        query = supabase.from_("modules").select("*").eq("slug", slug)
        if course_id:
            query = query.eq("course_id", course_id)
        res = query.limit(1).execute()
        return res.data[0] if res and res.data else None

    def insert_module(self, course_id: str, title: str, description: str, order_index: int, slug: str = "") -> dict:
        res = supabase.from_("modules").insert([{
            "course_id": course_id,
            "title": title,
            "description": description,
            "order_index": order_index,
            "slug": slug
        }]).execute()
        return res.data[0] if res.data else {}

    def delete_module(self, module_id: str):
        supabase.from_("modules").delete().eq("id", module_id).execute()


    def get_cards(self, module_id: str) -> list:
        res = supabase.from_("cards").select("*").eq("module_id", module_id)\
            .order("order_index").execute()
        return res.data or []

    def get_card(self, card_id: str) -> dict | None:
        res = supabase.from_("cards").select("*").eq("card_id", card_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def get_card_by_slug(self, slug: str, module_id: str = None) -> dict | None:
        query = supabase.from_("cards").select("*").eq("slug", slug)
        if module_id:
            query = query.eq("module_id", module_id)
        res = query.limit(1).execute()
        return res.data[0] if res and res.data else None

    def insert_card(self, module_id: str, card_data: dict) -> dict:
        card_data["module_id"] = module_id
        res = supabase.from_("cards").insert([card_data]).execute()
        return res.data[0] if res.data else {}

    def delete_card(self, card_id: str):
        supabase.from_("cards").delete().eq("card_id", card_id).execute()


course_repo = CourseRepository()
