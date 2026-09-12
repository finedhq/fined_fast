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
            "user_sub, email, article_score, expense_score, course_score, consistency_score, fin_stars"
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

    def save_reward_notification(self, email: str):
        """Save user email for reward drop notifications"""
        try:
            supabase.from_("reward_notifications").insert([{
                "email": email
            }]).execute()
        except Exception:
            # Fallback if table doesn't exist yet, save as notification or log
            pass

    def log_score_change(self, email: str, old: int = 0, new: int = 0, change: int = 0, desc: str = "", **kwargs):
        old_val = kwargs.get("old_score", old)
        new_val = kwargs.get("new_score", new)
        change_val = kwargs.get("change", change)
        desc_val = kwargs.get("description", kwargs.get("desc", desc))
        try:
            supabase.from_("finScoreLogs").insert([{
                "email": email,
                "old_score": old_val,
                "new_score": new_val,
                "change": change_val,
                "description": desc_val
            }]).execute()
        except Exception as e:
            print(f"Warning: Failed to log score change for {email}: {e}")
    
    def get_score_logs(self, email: str) -> list:
        res = supabase.from_("finScoreLogs").select("*").eq("email", email)\
            .order("created_at", desc=True).execute()
        return res.data or []

    def get_leaderboard(self, limit: int = None, timeframe: str = "all_time") -> list:
        """Fetch all users, compute fin_score based on timeframe, sort, return top N with rank"""
        from datetime import datetime, timezone, timedelta
        
        users = self.get_all_for_leaderboard()
        now = datetime.now(timezone.utc)
        
        timeframe_logs = []
        if timeframe == "this_week":
            # Monday-based start of week
            start_date = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            try:
                logs_res = supabase.from_("finScoreLogs").select("email, change, description").gte("created_at", start_date).execute()
                timeframe_logs = logs_res.data or []
            except Exception as e:
                print(f"Error fetching weekly logs: {e}")
        elif timeframe == "this_month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
            try:
                logs_res = supabase.from_("finScoreLogs").select("email, change, description").gte("created_at", start_date).execute()
                timeframe_logs = logs_res.data or []
            except Exception as e:
                print(f"Error fetching monthly logs: {e}")

        # Build map of score changes for this timeframe
        timeframe_map = {}
        for l in timeframe_logs:
            if "FinStars" not in (l.get("description") or ""):
                em = l.get("email")
                if em:
                    timeframe_map[em] = timeframe_map.get(em, 0) + max(0, l.get("change") or 0)

        for u in users:
            all_time_score = (
                (u.get("article_score") or 0) +
                (u.get("expense_score") or 0) +
                (u.get("course_score") or 0) +
                (u.get("consistency_score") or 0)
            )
            u["all_time_score"] = all_time_score
            
            if timeframe == "this_week":
                u["fin_score"] = timeframe_map.get(u.get("email"), 0)
            elif timeframe == "this_month":
                u["fin_score"] = timeframe_map.get(u.get("email"), 0)
            else: # all_time
                u["fin_score"] = all_time_score

        # Sort primarily by timeframe fin_score, tie-break with all_time_score
        if timeframe in ("this_week", "this_month"):
            ranked = sorted(users, key=lambda x: (x["fin_score"], x["all_time_score"]), reverse=True)
        else:
            ranked = sorted(users, key=lambda x: x["fin_score"], reverse=True)

        if limit:
            ranked = ranked[:limit]

        for i, u in enumerate(ranked):
            u["rank"] = i + 1
            
        return ranked

    def get_rank(self, email: str) -> int:
        """Get a specific user's rank position"""
        leaderboard = self.get_leaderboard(limit=None, timeframe="all_time")
        for entry in leaderboard:
            if entry.get("email") == email:
                return entry["rank"]
        return 0


user_repo = UserRepository()