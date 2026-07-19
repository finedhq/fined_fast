# Business logic for reading limits and ratings

from datetime import date
from app.repositories.article_repo import article_repo
from app.repositories.user_repo import user_repo
from app.services.score_service import score_service
import re
from xml.sax.saxutils import escape

class ArticleService:

    def get_all(self, limit: int = 30, offset: int = 0, tag: str | None = None) -> list:
        """Fetch all articles — equivalent to getAllArticles"""
        return article_repo.get_all(limit=limit, offset=offset, tag=tag)

    def get_by_slug(self, slug: str) -> dict | None:
        """Fetch a specific article directly by its slug."""
        return article_repo.get_by_slug(slug)

    def get_adjacent(self, slug: str) -> dict:
        """Get previous and next articles based on current slug"""
        article = self.get_by_slug(slug)
        if not article or not article.get("created_at"):
            return {"previous": None, "next": None}
        return article_repo.get_adjacent(article["created_at"])

    def add(self, title: str, content: str, description: str = "", image_url: str = "", tag: str = "Finance", author_id: str = None) -> dict:
        """Admin adds article — equivalent to addArticle"""
        slug = self._generate_slug(title)
        return article_repo.insert(title=title, content=content, description=description, image_url=image_url, tag=tag, slug=slug, author_id=author_id)
        
    def get_all_authors(self) -> list:
        return article_repo.get_all_authors()

    def get_author_by_slug(self, slug: str) -> dict | None:
        return article_repo.get_author_by_slug(slug)

    def get_articles_by_author(self, author_id: str) -> list:
        return article_repo.get_articles_by_author(author_id)
    def delete(self, article_id: str):
        """Admin deletes article — fixes the original bug where data was undefined"""
        article_repo.delete(article_id)

    def mark_read(self, email: str) -> dict:
        """
        Called when user reads an article.
        Returns score update info for frontend to display
        e.g. "+2 points", "streak bonus +5", etc.
        """
        today = date.today()
        user  = user_repo.get_by_email(email)
        if not user:
            return {"updated": False, "message": "User not found"}
        result = score_service.update_article(user, today)
        if not result.get("updated"):
            return result
        
        # Build exact reasons matching Express server logs:
        # parts = [
        #   `✅ Read article (${newCountToday}/3 today)`,
        #   bonus > 0 ? `🎉 Bonus: +${bonus} for 3-day streak` : "",
        #   penalty < 0 ? `⚠️ Penalty: ${penalty} for breaking streak` : ""
        # ];
        parts = [
            f"✅ Read article ({result['article_count']}/3 today)"
        ]
        if result.get("bonus", 0) > 0:
            parts.append(f"🎉 Bonus: +{result['bonus']} for 3-day streak")
        if result.get("penalty", 0) < 0:
            parts.append(f"⚠️ Penalty: {result['penalty']} for breaking streak")
        reasons = [p for p in parts if p]

        score_service.apply_and_log(
            user    = user,
            updates = result["updates"],
            reasons = reasons
        )
        return {
            "updated":       True,
            "points_earned": result["points_earned"],
            "article_count": result["article_count"],
            "streak":        result["streak"],
            "bonus":         result["bonus"],
            "penalty":       result["penalty"],
            "new_score":     result["updates"]["article_score"]
        }
    
    def get_user_rating(self, email: str, article_id: str) -> dict | None:
        """Get this user's rating for a specific article"""
        return article_repo.get_user_rating(email, article_id)


    def rate(self,email:str,article_id:str,rating:float)->dict:
        """
        Save or update rating, recalculate article average.
        Flow:
        1. Save user's rating (upsert)
        2. Fetch all ratings for this article
        3. Compute new average
        4. Update article.rating with new average
        """

        article_repo.upsert_rating(email, article_id, rating)
        all_ratings = article_repo.get_all_ratings_for_article(article_id)
        values      = [r["rating"] for r in all_ratings if r.get("rating") is not None]
        new_avg     = sum(values) / len(values) if values else rating

        article_repo.update_avg_rating(article_id, new_avg)

        return {"average_rating": round(new_avg, 2), "total_ratings": len(values)}

    def save_newsletter_email(self, email: str, entered_email: str):
        """Save newsletter subscription — equivalent to saveEmail"""
        article_repo.save_newsletter_email(email, entered_email)

    def remove_newsletter_email(self, email: str, entered_email: str):
        """Remove newsletter subscription — equivalent to removeEmail"""
        article_repo.remove_newsletter_email(email, entered_email)

    def get_newsletter_email(self, email: str) -> list:
        """Get user's newsletter email — equivalent to fetchEnteredEmail"""
        return article_repo.get_newsletter_email(email)

    def get_all_newsletter_emails(self) -> list:
        """Admin: get all subscriber emails — for newsletter sending"""
        return article_repo.get_all_newsletter_emails()

    def save_waitlist_email(self, email: str):
        """Save waitlist email subscription"""
        article_repo.save_waitlist_email(email)

    def _generate_slug(self, title: str) -> str:
        # Must exactly match generateSlug() in ArticlesPage.jsx
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower())
        slug = re.sub(r'^-+|-+$', '', slug)
        return slug

    def build_sitemap_xml(self) -> str:
        articles = article_repo.get_all_for_sitemap()

        static_urls = [
            ("https://myfined.com/", "weekly", "1.0", None),
            ("https://myfined.com/articles", "daily", "0.8", None),
        ]

        entries = []
        for loc, changefreq, priority, lastmod in static_urls:
            entries.append(f"<url><loc>{loc}</loc><changefreq>{changefreq}</changefreq><priority>{priority}</priority></url>")

        for a in articles:
            slug = self._generate_slug(a["title"])
            loc = escape(f"https://myfined.com/articles/{slug}")
            lastmod_raw = a.get("published_at") or a.get("created_at")
            lastmod = lastmod_raw[:10] if lastmod_raw else ""
            entries.append(
                f"<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>"
            )

        body = "".join(entries)
        return f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'



article_service=ArticleService()