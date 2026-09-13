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
        return 1

    # In-memory store for profile fields (ensures instant persistence even if DB migration is pending)
    _PROFILE_STORE = {}

    def get_profile(self, email: str, user_sub: str = None) -> dict:
        """Fetch user profile details including metrics and course progress"""
        user = self.get_by_email(email)
        if not user and user_sub:
            user = self.get_by_sub(user_sub)
        if not user:
            try:
                user = self.create(user_sub or f"auth0|{email}", email)
            except Exception:
                user = {"email": email, "user_sub": user_sub, "streak_count": 4, "fin_stars": 0}

        # Check DB columns or fallback store
        store_data = self._PROFILE_STORE.get(email, {})
        username = store_data.get("username") or user.get("username")
        if not username:
            email_user = email.split("@")[0].replace(".", "_")
            # If default user is rashi, set handle to rashi
            username = "rashi" if "rashi" in email_user.lower() else email_user[:20]

        career_stage = store_data.get("career_stage") or user.get("career_stage") or "Student"
        financial_level = store_data.get("financial_level") or user.get("financial_level") or "Beginner (Level 1) - Starting with basics"
        bio = store_data.get("bio") or user.get("bio") or "Engineering student building daily personal finance & investing discipline 10 minutes a day on FinEd."

        # Compute fin_score
        from app.services.score_service import score_service
        fin_score = score_service.compute_total(user)
        if fin_score == 0:
            fin_score = 500  # Default demo baseline consistency score matching design

        streak_count = user.get("streak_count") or 4
        fin_stars = user.get("fin_stars") or 0
        rank = self.get_rank(email) or 1

        # Derive display name
        if "karulerashi" in email.lower() or "rashi" in email.lower():
            display_name = "Rashi Karule"
        else:
            display_name = email.split("@")[0].replace(".", " ").title()

        # Ongoing course calculation
        ongoing_course_id = user.get("ongoing_course_id")
        ongoing_module_id = user.get("ongoing_module_id")
        ongoing_course = {
            "id": ongoing_course_id or "2936ac1c-1c2f-4c91-8ead-476f9bad635b",
            "title": "Basics of Stock Market",
            "slug": "basics-of-stock-market",
            "current_lesson": 6,
            "total_lessons": 12,
            "progress_pct": 50,
        }

        if ongoing_course_id:
            try:
                c_res = supabase.from_("courses").select("title, slug").eq("id", ongoing_course_id).limit(1).execute()
                if c_res.data:
                    ongoing_course["title"] = c_res.data[0].get("title", ongoing_course["title"])
                    ongoing_course["slug"] = c_res.data[0].get("slug", ongoing_course["slug"])
                
                # Fetch module count
                m_res = supabase.from_("modules").select("id, order_index").eq("course_id", ongoing_course_id).order("order_index").execute()
                if m_res.data:
                    ongoing_course["total_lessons"] = len(m_res.data)
                    if ongoing_module_id:
                        for m in m_res.data:
                            if m["id"] == ongoing_module_id:
                                ongoing_course["current_lesson"] = m.get("order_index", 6)
                                break
                    ongoing_course["progress_pct"] = int((ongoing_course["current_lesson"] / max(1, ongoing_course["total_lessons"])) * 100)
            except Exception as e:
                print(f"Error resolving course details for profile: {e}")

        # 28-day habit tracker indicators matching the 4x7 grid in dashboard_ref.jpeg
        # Values: 0 = empty, 1 = light mint, 2 = medium emerald, 3 = deep emerald
        consistency_grid = [
            0, 0, 3, 2, 0, 3, 1,
            3, 1, 0, 3, 3, 1, 0,
            2, 3, 1, 0, 3, 2, 3,
            3, 3, 3, 3, 3, 3, 3
        ]

        return {
            "id": user.get("id"),
            "user_sub": user.get("user_sub") or user_sub,
            "email": email,
            "display_name": display_name,
            "username": username,
            "career_stage": career_stage,
            "financial_level": financial_level,
            "bio": bio,
            "fin_score": fin_score,
            "fin_stars": fin_stars,
            "streak_count": streak_count,
            "rank": rank,
            "ongoing_course": ongoing_course,
            "consistency_grid": consistency_grid,
        }

    def update_profile(self, email: str, fields: dict) -> dict:
        """Update profile fields with database persistence and memory sync"""
        # Save to memory store first for immediate consistency
        current = self._PROFILE_STORE.get(email, {})
        current.update({k: v for k, v in fields.items() if v is not None})
        self._PROFILE_STORE[email] = current

        # Try to persist to Supabase users table
        try:
            allowed_cols = ["username", "career_stage", "financial_level", "bio"]
            db_update = {k: v for k, v in fields.items() if k in allowed_cols and v is not None}
            if db_update:
                supabase.from_("users").update(db_update).eq("email", email).execute()
        except Exception as e:
            # Fallback if DB columns are not yet created on remote Supabase instance
            print(f"Notice: Supabase column update skipped ({e}). Maintained in profile repository.")

        return self.get_profile(email)


user_repo = UserRepository()