# Database queries for articles and ratings
from app.integrations.supabase_client import supabase


class ArticleRepository:

    def get_all(self, limit: int = 30, offset: int = 0) -> list:
        res = supabase.from_("articles").select("*")\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1).execute()
        return res.data or []

    def insert(self, title: str, content: str, image_url: str = "") -> dict:
        res = supabase.from_("articles").insert([{
            "title": title,
            "content": content,
            "image_url": image_url
        }]).select().single().execute()
        return res.data

    def delete(self, article_id: str):
        supabase.from_("articles").delete().eq("id", article_id).execute()

    def update_avg_rating(self, article_id: str, avg: float):
        supabase.from_("articles").update({"rating": round(avg, 2)})\
            .eq("id", article_id).execute()

    def get_user_rating(self, email: str, article_id: str):
        res = supabase.from_("article_ratings").select("rating")\
            .eq("email", email).eq("article_id", article_id).maybe_single().execute()
        return res.data

    def upsert_rating(self, email: str, article_id: str, rating: float):
        supabase.from_("article_ratings").upsert(
            [{"email": email, "article_id": article_id, "rating": rating}],
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


article_repo = ArticleRepository()
