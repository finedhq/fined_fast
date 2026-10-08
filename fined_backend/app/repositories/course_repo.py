# Database queries for courses, modules, and cards
import time
from app.integrations.supabase_client import supabase
from app.services.course_visibility import is_listed, is_released


class CourseRepository:
    def __init__(self):
        self._listed_cache = None
        self._listed_cache_time = 0
        self._listed_cache_ttl = 60  # 60s in-memory cache

    def clear_cache(self):
        self._listed_cache = None
        self._listed_cache_time = 0

    def get_all(self) -> list:
        res = supabase.from_("courses").select("*").order("created_at", desc=True).execute()
        return res.data or []

    def get_listed(self) -> list:
        """Courses shown on public lists (published only), newest first with 60s memory cache."""
        now = time.time()
        if self._listed_cache and (now - self._listed_cache_time < self._listed_cache_ttl):
            return [dict(c) for c in self._listed_cache]

        data = self.with_released_counts([c for c in self.get_all() if is_listed(c)])
        self._listed_cache = data
        self._listed_cache_time = now
        return data

    def with_released_counts(self, courses: list) -> list:
        """Learners' view: `modules_count` = released modules only. The column
        itself (kept by a DB trigger) counts every module, hidden ones too."""
        ids = [c["id"] for c in courses if c.get("id")]
        if not ids:
            return courses
        rows = supabase.from_("modules").select("*").in_("course_id", ids).execute().data or []
        counts = {}
        for m in rows:
            if is_released(m):
                counts[m["course_id"]] = counts.get(m["course_id"], 0) + 1
        for c in courses:
            if c.get("id"):
                c["modules_count"] = counts.get(c["id"], 0)
        return courses

    def get_by_id_cached(self, course_id: str) -> dict | None:
        if self._listed_cache:
            for c in self._listed_cache:
                if c.get("id") == course_id:
                    return dict(c)
        return self.get_by_id(course_id)

    def get_by_id(self, course_id: str) -> dict | None:
        res = supabase.from_("courses").select("*").eq("id", course_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def get_by_slug(self, slug: str) -> dict | None:
        res = supabase.from_("courses").select("*").eq("slug", slug).limit(1).execute()
        return res.data[0] if res and res.data else None

    def insert(self, title: str, description: str, thumbnail_url: str = "", slug: str = "") -> dict:
        self.clear_cache()
        res = supabase.from_("courses").insert([{
            "title": title,
            "description": description,
            "thumbnail_url": thumbnail_url,
            "slug": slug
        }]).execute()
        return res.data[0] if res.data else {}

    def delete(self, course_id: str):
        self.clear_cache()
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

    def insert_module(self, course_id: str, title: str, description: str, order_index: int, slug: str = "", status: str | None = None) -> dict:
        row = {
            "course_id": course_id,
            "title": title,
            "description": description,
            "order_index": order_index,
            "slug": slug
        }
        if status:  # only sent when needed, so this also works before migration 005
            row["status"] = status
        res = supabase.from_("modules").insert([row]).execute()
        return res.data[0] if res.data else {}

    def set_module_status(self, module_id: str, status: str, published_at: str | None) -> dict:
        res = supabase.from_("modules").update({"status": status, "published_at": published_at}).eq("id", module_id).execute()
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
        query = supabase.from_("cards").select("*").eq("card_id", slug)
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
