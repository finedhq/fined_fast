# Database queries for user profile metrics

from app.integrations.supabase_client import supabase

class UserRepository:

    def get_by_sub(self, user_sub: str):
        res = supabase.from_("users").select("*").eq("user_sub", user_sub).limit(1).execute()
        return res.data[0] if res and res.data else None
    
    def get_by_email(self, email: str):
        res = supabase.from_("users").select("*").eq("email", email).limit(1).execute()
        return res.data[0] if res and res.data else None
    
    def create(self, user_sub: str, email: str) -> dict:
        res = supabase.from_("users").insert([{
            "user_sub": user_sub,
            "email": email,
            "streak_count": 1,
            "fin_stars": 0,
        }]).execute()
        return res.data[0] if res.data else {}

    def update_fields(self, email: str, fields: dict):
        supabase.from_("users").update(fields).eq("email", email).execute()

    def get_all_for_leaderboard(self) -> list:
        res = supabase.from_("users").select(
            "user_sub, email, article_score, expense_score, course_score, consistency_score"
        ).execute()
        return res.data or []
    

    def has_feedback(self, email: str) -> bool:
        res = supabase.from_("user_feedbacks").select("id").eq("email", email).limit(1).execute()
        return bool(res and res.data)


    def save_feedback(self, email: str, form: dict):
        payload = {
            "email": email,
            "name": form.get("name"),
            "q1_helpfulness": form.get("q1_helpfulness"),
            "q2_difficulty": form.get("q2_difficulty"),
            "q3_navigation": form.get("q3_navigation"),
            "q4_design": form.get("q4_design"),
            "q5_confusing": form.get("q5_confusing"),
            "q5_details": form.get("q5_details"),
            "q6_favFeature": form.get("q6_favFeature"),
            "q7_returnLikelihood": form.get("q7_returnLikelihood"),
            "additionalFeedback": form.get("additionalFeedback")
        }
        
        # Cast numeric columns to integers safely
        for col in ["q1_helpfulness", "q3_navigation", "q7_returnLikelihood"]:
            val = payload[col]
            if val is not None:
                try:
                    payload[col] = int(val)
                except (ValueError, TypeError):
                    payload[col] = None

        supabase.from_("user_feedbacks").insert([payload]).execute()

    
    def log_score_change(self, email: str, old: int, new: int, change: int, desc: str):
        supabase.from_("finScoreLogs").insert([{
            "email": email,
            "old_score": old,
            "new_score": new,
            "change": change,
            "description": desc
        }]).execute()
    
    def get_score_logs(self, email: str) -> list:
        res = supabase.from_("finScoreLogs").select("*").eq("email", email)\
            .order("created_at", desc=True).execute()
        return res.data or []

    def get_leaderboard(self, limit: int = 50) -> list:
        """Fetch all users, compute fin_score, sort, return top N with rank"""
        users = self.get_all_for_leaderboard()
        for u in users:
            u["fin_score"] = (
                (u.get("article_score") or 0) +
                (u.get("expense_score") or 0) +
                (u.get("course_score") or 0) +
                (u.get("consistency_score") or 0)
            )
        ranked = sorted(users, key=lambda x: x["fin_score"], reverse=True)[:limit]
        for i, u in enumerate(ranked):
            u["rank"] = i + 1
        return ranked

    def get_rank(self, email: str) -> int:
        """Get a specific user's rank position"""
        leaderboard = self.get_leaderboard(limit=1000)
        for entry in leaderboard:
            if entry["email"] == email:
                return entry["rank"]
        return 0


user_repo = UserRepository()