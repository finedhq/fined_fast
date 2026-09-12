# Business logic for dashboard feed aggregates
from datetime import date, timedelta

from app.repositories.user_repo import user_repo
from app.repositories.notification_repo import notification_repo
from app.services.score_service import score_service
from app.services.notification_service import notification_service


class HomeService:
    def get_dashboard(self,user_sub:str,email:str)->dict:
        """
        Main dashboard call
        Steps:
        1. Get or create user
        2. Update streak (display streak, not score streak)
        3. Update consistency score
        4. Compute leaderboard rank
        5. Get ongoing course
        6. Return full dashboard payload
        """



        today     = date.today()
        today_str = today.isoformat()
        yesterday_str = (today - timedelta(days=1)).isoformat()

        #step 1
        user = user_repo.get_by_sub(user_sub)
        if not user:
            user = user_repo.get_by_email(email)
            if user:
                user_repo.update_fields(email, {"user_sub": user_sub})
                user["user_sub"] = user_sub
            else:
                try:
                    user = user_repo.create(user_sub=user_sub, email=email)
                except Exception:
                    # Catch unique constraint violation from concurrent requests (React StrictMode)
                    user = user_repo.get_by_email(email)
                    if not user:
                        # Fallback if the concurrent transaction hasn't committed yet
                        user = {"user_sub": user_sub, "email": email, "streak_count": 1, "fin_stars": 0}
        
        # Ensure user is absolutely never None
        if not user:
            user = {"user_sub": user_sub, "email": email, "streak_count": 1, "fin_stars": 0}
        
        #step 2
        streak    = user.get("streak_count") or 1
        last_date = (user.get("last_date") or "")[:10]
        if last_date == yesterday_str:
            streak += 1
            if streak == 3:
                notification_service.send(email, "You're on a 3-day streak!")
         
        elif last_date != today_str:
            streak = 1
            notification_service.send(email, "Streak reset. Try to be more consistent.")
        streak_updates = {"streak_count": streak, "last_date": today_str}

        #step 3

        consistency_result = score_service.update_consistency(user, today)
        all_updates = {**streak_updates, **consistency_result["updates"]}
        score_service.apply_and_log(user, all_updates, consistency_result["reasons"])


        user = user_repo.get_by_email(email)
        if not user:
            user = {"user_sub": user_sub, "email": email, "streak_count": streak, "fin_stars": 0}

        #step 4
        rank=user_repo.get_rank(email)

        #step 5
        show_feedback=not user_repo.has_feedback(email)

        #step 6
        ongoing_course_id = user.get("ongoing_course_id")
        fin_score = score_service.compute_total(user)


        return {
            "email":             user.get("email"),
            "streak_count":      user.get("streak_count"),
            "fin_stars":         user.get("fin_stars") or 0,
            "article_score":     user.get("article_score") or 0,
            "expense_score":     user.get("expense_score") or 0,
            "course_score":      user.get("course_score") or 0,
            "consistency_score": user.get("consistency_score") or 0,
            "fin_score":         fin_score,
            "rank":              rank,
            "show_feedback":     show_feedback,
            "ongoing_course_id": ongoing_course_id,
        }

    def get_leaderboard(self, timeframe: str = "all_time"):
        """
        Returns users ranked by FinScore for the requested timeframe.
        Score computed in Python (not DB) for flexibility.
        """
        return user_repo.get_leaderboard(limit=None, timeframe=timeframe)

    def save_reward_notification(self, email: str):
        """Save user waitlist interest for reward drop"""
        user_repo.save_reward_notification(email)

    def credit_finstars(self, email: str, action: str, amount: int) -> dict:
        """Credit fin_stars to user and log transaction"""
        user = user_repo.get_by_email(email)
        if not user:
            # Create user entry if not found
            try:
                user = user_repo.create(user_sub=f"auth0|{email}", email=email)
            except Exception:
                user = user_repo.get_by_email(email)
            if not user:
                return {"error": "User not found and could not be created"}
        
        current_stars = user.get("fin_stars") or 0
        new_stars = current_stars + max(0, amount)
        user_repo.update_fields(email, {"fin_stars": new_stars})
        
        try:
            user_repo.log_score_change(
                email=email,
                old=current_stars,
                new=new_stars,
                change=amount,
                desc=f"Earned +{amount} FinStars for {action}"
            )
        except Exception as log_err:
            print(f"Score log warning: {log_err}")

        return {
            "email": email,
            "fin_stars": new_stars,
            "credited": amount,
            "action": action
        }
    
    def get_score_logs(self, email: str) -> list:
        """FinScore change history"""
        return user_repo.get_score_logs(email)
    def save_feedback(self, email: str, form: dict):
        """Save feedback form"""
        user_repo.save_feedback(email, form)

    def get_recommendations(self,email:str,course_id:str)->list:
        """
        Tag-based scheme recommendations.
        Matches user's current course tags against product tags.
        """

        from app.repositories.product_repo import product_repo
        from app.repositories.course_repo import course_repo
        course = course_repo.get_by_id(course_id)
        if not course:
            return []
        all_products = product_repo.get_all_latest()

        course_title = (course.get("title") or "").lower()
        recommendations = []
        for product in all_products:
            goal     = (product.get("goal") or "").lower()
            category = (product.get("category") or "").lower()
            risk     = (product.get("risk_profile") or "").lower()
            if any(word in course_title for word in [goal, category, risk]):
                recommendations.append(product)
            if len(recommendations) >= 3:
                break
        return recommendations

        
home_service=HomeService()





