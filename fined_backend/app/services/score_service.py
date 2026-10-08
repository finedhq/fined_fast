# Business logic for gamified streaks and XP levels
from datetime import date, timedelta
from app.repositories.user_repo import user_repo

class ScoreService:
    """
    Single source of truth for ALL FinScore calculations.
    Total FinScore = article_score + course_score + consistency_score
    Max:                  150      +      500     +       200        = 850
    """

    def compute_total(self,user:dict)->int:
        return (
            (user.get("article_score") or 0) +
            (user.get("course_score") or 0) +
            (user.get("consistency_score") or 0)
        )
    
    # Consistency Score (max 200)
    # Triggered every time user loads the home dashboard


    def update_consistency(self,user:dict,today:date)->dict:
        """
        Rules:
        - 5 active days in a week  → +10 (once per week)
        - 4 consecutive weeks      → +20 bonus, reset counter
        - 7+ days inactive         → -10 per full week
        """


        today_str=today.isoformat()
        # Sunday-based week — matches JS getDay() behavior in old server
        current_week_str = (today - timedelta(days=today.isoweekday() % 7)).isoformat()

        active_days = user.get("active_days_this_week") or 0
        week_start  = user.get("week_start_date")
        weekly_streak = user.get("weekly_streak_count") or 0
        last_active = user.get("last_active_date")
        inactivity  = user.get("inactivity_days") or 0
        rewarded    = user.get("consistency_rewarded_this_week") or False
        score       = user.get("consistency_score") or 0
        reasons     = []


        if week_start !=current_week_str:
            active_days=0
            week_start=current_week_str
            rewarded=False
        
        if last_active != today_str:
            last_active_date = date.fromisoformat(last_active) if last_active else today
            gap = (today - last_active_date).days
            active_days += 1
            inactivity  += gap

        if active_days == 5 and not rewarded:
            score   += 10
            weekly_streak += 1
            rewarded = True
            reasons.append("+10 for 5 active days this week")
        

        if weekly_streak == 4:
            score += 20
            weekly_streak = 0
            reasons.append("+20 for 4-week consistency streak")
        

        if inactivity >= 7:
            penalty   = (inactivity // 7) * 10
            score    -= penalty
            inactivity = inactivity % 7
            reasons.append(f"-{penalty} for inactivity")

        score = max(0, min(score, 200))


        updates = {
            "consistency_score":             score,
            "active_days_this_week":         active_days,
            "week_start_date":               current_week_str,
            "weekly_streak_count":           weekly_streak,
            "last_active_date":              today_str,
            "inactivity_days":               inactivity,
            "consistency_rewarded_this_week": rewarded,
        }
        return {"updates": updates, "reasons": reasons, "new_score": score}

    # Article Score (max 150)
    # Triggered when user reads an article


    def update_article(self,user:dict,today:date)->dict:
        """
        Rules:
        - +2 per article read (max 3/day)
        - streak % 3 == 0 → +5 bonus
        - broke streak (gap > 1 day) and streak > 3 → -5 penalty
        """

        today_str     = today.isoformat()
        yesterday_str = (today - timedelta(days=1)).isoformat()
        streak        = user.get("article_streak_count") or 0
        score         = user.get("article_score") or 0
        last_read     = (user.get("last_article_read_date") or "")[:10]
        count_today   = user.get("article_count_today") or 0

        if last_read == today_str and count_today >= 3:
            return {"updated": False, "message": "Daily article limit (3) reached."}

        bonus   = 0
        penalty = 0
        points  = 2
        new_count = count_today + 1 if last_read == today_str else 1

        if last_read != today_str:
            if last_read == yesterday_str:
                streak += 1
            else:
                if streak > 3:
                    penalty = -5
                streak = 1
            if streak % 3 == 0:
                bonus = 5
            points += bonus + penalty

        new_score = max(0, min(score + points, 150))
        actual_points = new_score - score

        updates = {
            "article_score":          new_score,
            "last_article_read_date": today_str,
            "article_count_today":    new_count,
        }
        if last_read != today_str:
            updates["article_streak_count"] = streak

        return {
            "updated":      True,
            "updates":      updates,
            "points_earned": actual_points,
            "streak":       streak,
            "article_count": new_count,
            "bonus":        bonus,
            "penalty":      penalty,
        }

    # Course Score (max 500)
    def update_course_module(self, user: dict) -> dict:
        """
        +20 when user completes all cards in a module.
        Only first 5 courses count toward score.
        """
        score       = user.get("course_score") or 0
        course_count = user.get("course_count") or 0
        if course_count >= 5:
            return {"updates": {}, "points": 0}
        new_score = min(score + 20, 500)
        updates   = {"course_score": new_score}
        return {"updates": updates, "points": 20}



    def update_course_quiz(self, user: dict, quiz_percent: float) -> dict:
        """
        Triggered when ALL cards across ALL modules of a course are done.
        - >= 80% → +10
        - 60-79% → +5
        - < 60%  → -5
        Also increments course_count (max 5 courses contribute).
        """
        score        = user.get("course_score") or 0
        course_count = user.get("course_count") or 0
        reasons      = []
        if quiz_percent >= 80:
            bonus = 10
            reasons.append(f"+10 quiz bonus ({quiz_percent:.0f}% correct)")
        elif quiz_percent >= 60:
            bonus = 5
            reasons.append(f"+5 quiz bonus ({quiz_percent:.0f}% correct)")
        else:
            bonus = -5
            reasons.append(f"-5 quiz penalty ({quiz_percent:.0f}% correct)")
        new_score    = max(0, min(score + bonus, 500))
        new_count    = course_count + 1
        updates = {
            "course_score": new_score,
            "course_count": new_count,
        }
        return {"updates": updates, "reasons": reasons, "bonus": bonus}

    def apply_and_log(self, user: dict, updates: dict, reasons: list):
        """
        1. Apply updates to the user row (only if values actually changed)
        2. Compute old vs new total score
        3. Write to finScoreLogs if score changed
        """
        if not updates:
            return

        has_changes = any(user.get(k) != v for k, v in updates.items())
        email = user.get("email")
        if not email:
            return

        old_total = self.compute_total(user)
        user.update(updates)

        if has_changes:
            user_repo.update_fields(email, updates)

        new_total = self.compute_total(user)
        delta = new_total - old_total
        if delta != 0 and reasons:
            user_repo.log_score_change(
                email=email,
                old=old_total,
                new=new_total,
                change=delta,
                desc=" | ".join(reasons)
            )

score_service = ScoreService()