# Business logic for reading limits and ratings

from datetime import date
from app.repositories.article_repo import article_repo
from app.repositories.user_repo import user_repo
from app.services.score_service import score_service



class ArticleService:

    def get_all(self, limit: int = 30, offset: int = 0) -> list:
        """Fetch all articles — equivalent to getAllArticles"""
        return article_repo.get_all(limit=limit, offset=offset)
        
    def add(self, title: str, content: str, image_url: str = "") -> dict:
        """Admin adds article — equivalent to addArticle"""
        return article_repo.insert(title=title, content=content, image_url=image_url)
        
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


article_service=ArticleService()