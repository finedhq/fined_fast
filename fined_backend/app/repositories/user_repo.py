# Database queries for user profile metrics

from app.integrations.supabase_client import supabase

class UserRepository:

    def get_by_sub(self, user_sub: str):
        res = supabase.from_("users").select("*").eq("user_sub", user_sub).limit(1).execute()
        return res.data[0] if res and res.data else None
    
    def get_by_email(self, email: str):
        res = supabase.from_("users").select("*").eq("email", email).limit(1).execute()
        return res.data[0] if res and res.data else None
    
    def create(self, user_sub: str, email: str, name: str = None) -> dict:
        payload = {
            "user_sub": user_sub,
            "email": email,
            "streak_count": 0,
            "fin_stars": 0,
        }
        if name:
            payload["name"] = name
        try:
            res = supabase.from_("users").insert([payload]).execute()
            return res.data[0] if res and res.data else payload
        except Exception:
            if "name" in payload:
                payload.pop("name", None)
                try:
                    res = supabase.from_("users").insert([payload]).execute()
                    return res.data[0] if res and res.data else payload
                except Exception:
                    return payload
            return payload

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

    def get_profile(self, email: str, user_sub: str = None, name: str = None) -> dict:
        """Fetch user profile details including metrics and course progress"""
        from datetime import datetime, timezone, timedelta
        user = self.get_by_email(email)
        if not user and user_sub:
            user = self.get_by_sub(user_sub)
        if not user:
            try:
                user = self.create(user_sub or f"auth0|{email}", email, name=name)
            except Exception:
                user = {"email": email, "user_sub": user_sub, "streak_count": 0, "fin_stars": 0}
        if not user:
            user = {"email": email, "user_sub": user_sub, "streak_count": 0, "fin_stars": 0}

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

        # Compute fin_score directly using the 4 columns from the user dict
        fin_score = int(
            (user.get("article_score") or 0) +
            (user.get("expense_score") or 0) +
            (user.get("course_score") or 0) +
            (user.get("consistency_score") or 0)
        )

        # Read streak_count directly from users table
        streak_count = int(user.get("streak_count") or user.get("streak") or 0)

        # Base fin_stars directly from users table
        fin_stars = int(user.get("fin_stars") or user.get("finstars") or 0)

        rank = self.get_rank(email) or 1

        # Derive display name / full name
        if name:
            display_name = name
        elif user.get("name"):
            display_name = user.get("name")
        elif user.get("display_name"):
            display_name = user.get("display_name")
        elif "karulerashi" in email.lower() or "rashi" in email.lower():
            display_name = "Rashi Karule"
        else:
            display_name = email.split("@")[0].replace(".", " ").title()

        # Query user activity dates from finScoreLogs and userCourses for the past 365 days,
        # and trace total accrued FinStars across event logs and completed course modules.
        activity_map = {}
        now = datetime.now(timezone.utc)
        one_year_ago_iso = (now - timedelta(days=365)).isoformat()

        stars_from_logs = 0
        try:
            logs_res = supabase.from_("finScoreLogs").select("change, description, created_at").eq("email", email).execute()
            for log in (logs_res.data or []):
                created_at = log.get("created_at")
                if created_at and str(created_at) >= one_year_ago_iso:
                    date_str = str(created_at)[:10]
                    activity_map[date_str] = activity_map.get(date_str, 0) + 1
                
                desc = str(log.get("description") or "").lower()
                if "finstar" in desc or "star" in desc:
                    stars_from_logs += max(0, int(log.get("change") or 0))
        except Exception as e:
            print(f"Notice: finScoreLogs query: {e}")

        stars_from_courses = 0
        try:
            uc_res = supabase.from_("userCourses").select("module_id, card_id, progress_type, status, completion_date, created_at").eq("email", email).eq("status", "completed").execute()
            completed_rows = uc_res.data or []
            completed_modules_set = set()
            completed_cards_count = 0
            for row in completed_rows:
                d = row.get("completion_date") or row.get("created_at")
                if d and str(d) >= one_year_ago_iso:
                    date_str = str(d)[:10]
                    activity_map[date_str] = activity_map.get(date_str, 0) + 1

                if row.get("module_id"):
                    completed_modules_set.add(row["module_id"])
                if row.get("progress_type") == "card" or row.get("card_id"):
                    completed_cards_count += 1

            # Check completed modules either from distinct module_ids or course_score (20 pts per module)
            course_score = int(user.get("course_score") or 0)
            estimated_modules_from_score = course_score // 20
            total_completed_modules = max(len(completed_modules_set), estimated_modules_from_score)

            # Reward rate: 10 FinStars per completed module (or 2 FinStars per completed card)
            stars_from_courses = max(total_completed_modules * 10, completed_cards_count * 2)
        except Exception as e:
            print(f"Notice: userCourses query: {e}")

        # Read fin_stars directly from users table
        fin_stars = int(user.get("fin_stars") or user.get("finstars") or 0)

        # If fin_stars is 0 or null, calculate total FinStars accrued from event logs and completed course modules
        if fin_stars == 0:
            total_accrued_stars = max(
                stars_from_logs + stars_from_courses,
                stars_from_logs,
                stars_from_courses
            )
            fin_stars = total_accrued_stars

            # Sync back to users table if accrued stars found
            if fin_stars > 0:
                try:
                    self.update_fields(email, {"fin_stars": fin_stars})
                    user["fin_stars"] = fin_stars
                except Exception as e:
                    print(f"Notice: syncing accrued fin_stars to users: {e}")
        elif stars_from_logs > fin_stars:
            fin_stars = stars_from_logs

        # Ongoing course calculation - Real course progress from userCourses / users
        ongoing_course_id = user.get("ongoing_course_id")
        if not ongoing_course_id:
            try:
                recent_uc = supabase.from_("userCourses").select("course_id").eq("email", email).not_.is_("course_id", "null").order("created_at", desc=True).limit(1).execute()
                if recent_uc.data and recent_uc.data[0].get("course_id"):
                    ongoing_course_id = recent_uc.data[0]["course_id"]
            except Exception as e:
                print(f"Notice: checking userCourses for active course: {e}")

        ongoing_course = None
        if ongoing_course_id:
            try:
                c_res = supabase.from_("courses").select("id, title, slug").eq("id", ongoing_course_id).limit(1).execute()
                if c_res.data:
                    course_row = c_res.data[0]
                    m_res = supabase.from_("modules").select("id, order_index").eq("course_id", ongoing_course_id).order("order_index").execute()
                    modules = m_res.data or []
                    total_modules = len(modules)

                    completed_modules_count = 0
                    try:
                        uc_progress = supabase.from_("userCourses").select("module_id, progress_type, status").eq("email", email).eq("course_id", ongoing_course_id).eq("status", "completed").execute()
                        completed_mod_ids = {p["module_id"] for p in (uc_progress.data or []) if p.get("module_id")}
                        completed_modules_count = len(completed_mod_ids)
                    except Exception as e:
                        print(f"Notice: counting completed course modules: {e}")

                    current_lesson = min(completed_modules_count + 1, total_modules) if total_modules > 0 else 0
                    progress_pct = int((completed_modules_count / max(1, total_modules)) * 100) if total_modules > 0 else 0

                    ongoing_course = {
                        "id": course_row.get("id"),
                        "title": course_row.get("title", "Active Course"),
                        "slug": course_row.get("slug"),
                        "current_lesson": current_lesson,
                        "completed_modules": completed_modules_count,
                        "total_lessons": total_modules,
                        "total_modules": total_modules,
                        "progress_pct": progress_pct,
                    }
            except Exception as e:
                print(f"Error resolving real course details for profile: {e}")

        consistency_grid = [
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0
        ]

        return {
            "id": user.get("id"),
            "user_sub": user.get("user_sub") or user_sub,
            "email": email,
            "display_name": display_name,
            "full_name": display_name,
            "username": username,
            "career_stage": career_stage,
            "financial_level": financial_level,
            "bio": bio,
            "fin_score": fin_score,
            "finscore": fin_score,
            "fin_stars": fin_stars,
            "finstars": fin_stars,
            "streak_count": streak_count,
            "streak": streak_count,
            "rank": rank,
            "ongoing_course": ongoing_course,
            "consistency_grid": consistency_grid,
            "activity_map": activity_map,
        }

    def update_profile(self, email: str, fields: dict, user_sub: str = None) -> dict:
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
                res = supabase.from_("users").update(db_update).eq("email", email).execute()
                if (not res or not res.data) and user_sub:
                    supabase.from_("users").update(db_update).eq("user_sub", user_sub).execute()
        except Exception as e:
            # Fallback if DB columns are not yet created on remote Supabase instance
            print(f"Notice: Supabase column update skipped ({e}). Maintained in profile repository.")

        return self.get_profile(email, user_sub)


user_repo = UserRepository()