# Database queries for articles and ratings
from app.integrations.supabase_client import supabase


class ArticleRepository:

    def get_all(self, limit: int = 30, offset: int = 0, tag: str | None = None) -> list:
        query = supabase.from_("articles").select("*").eq("status", "published")
        if tag:
            query = query.eq("tag", tag)
        res = query.order("created_at", desc=True)\
            .range(offset, offset + limit - 1).execute()
        return res.data or []

    def get_by_id(self, article_id: str) -> dict | None:
        res = supabase.from_("articles").select("*").eq("id", article_id).execute()
        return res.data[0] if res.data else None

    def insert(self, title: str, content: str, description: str = "", image_url: str = "", tag: str = "Finance", slug: str = "") -> dict:
        res = supabase.from_("articles").insert([{
            "title": title,
            "content": content,
            "description": description,
            "image_url": image_url,
            "tag": tag,
            "slug": slug
        }]).execute()
        return res.data[0] if res.data else {}

    def delete(self, article_id: str):
        supabase.from_("articles").delete().eq("id", article_id).execute()

    def update_avg_rating(self, article_id: str, avg: float):
        supabase.from_("articles").update({"rating": round(avg, 2)})\
            .eq("id", article_id).execute()

    def get_user_rating(self, email: str, article_id: str):
        res = supabase.from_("article_ratings").select("rating")\
            .eq("email", email).eq("article_id", article_id).limit(1).execute()
        return res.data[0] if res and res.data else None

    def upsert_rating(self, email: str, article_id: str, rating: float):
        supabase.from_("article_ratings").upsert(
            [{"email": email, "article_id": article_id, "rating": int(rating)}],
            on_conflict="email,article_id"
        ).execute()

    def get_all_ratings_for_article(self, article_id: str) -> list:
        res = supabase.from_("article_ratings").select("rating")\
            .eq("article_id", article_id).execute()
        return res.data or []

    def save_newsletter_email(self, email: str, entered_email: str):
        supabase.from_("newsletter_gmails").upsert(
            [{"email": email, "enteredEmail": entered_email}],
            on_conflict="email"
        ).execute()

    def remove_newsletter_email(self, email: str, entered_email: str):
        supabase.from_("newsletter_gmails").delete()\
            .eq("email", email).eq("enteredEmail", entered_email).execute()

    def get_newsletter_email(self, email: str):
        res = supabase.from_("newsletter_gmails").select("enteredEmail")\
            .eq("email", email).execute()
        return res.data or []

    def get_all_newsletter_emails(self) -> list:
        res = supabase.from_("newsletter_gmails").select("enteredEmail").execute()
        return [r["enteredEmail"] for r in (res.data or [])]

    def get_all_for_sitemap(self) -> list:
        res = supabase.from_("articles").select("id, title, created_at")\
            .eq("status", "published").order("created_at", desc=True).execute()
        return res.data or []

    def get_by_slug(self, slug: str) -> dict | None:
        res = supabase.from_("articles").select("*").eq("slug", slug).eq("status", "published").execute()
        return res.data[0] if res.data else None

    def get_adjacent(self, current_created_at: str) -> dict:
        prev_res = supabase.from_("articles").select("title, slug, created_at").eq("status", "published").lt("created_at", current_created_at).order("created_at", desc=True).limit(1).execute()
        next_res = supabase.from_("articles").select("title, slug, created_at").eq("status", "published").gt("created_at", current_created_at).order("created_at", desc=False).limit(1).execute()
        return {
            "previous": prev_res.data[0] if prev_res.data else None,
            "next": next_res.data[0] if next_res.data else None
        }

article_repo = ArticleRepository()
