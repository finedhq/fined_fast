# Pydantic models for user profiles and dashboards
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional


class UserDashboard(BaseModel):
    """
    Main dashboard response — mirrors what fetchData returns.
    All fields optional because new users may not have scores yet.
    """
    email: str
    streak_count: int = 0
    fin_stars: int = 0
    article_score: int = 0
    expense_score: int = 0
    course_score: int = 0
    consistency_score: int = 0
    fin_score: int = 0           
    rank: Optional[int] = None
    ongoing_course_id: Optional[str] = None
    show_feedback: bool = False


class LeaderboardEntry(BaseModel):
    """Single entry in the leaderboard"""
    user_sub: str
    email: str
    fin_score: int
    rank: int


class FinScoreLog(BaseModel):
    """Score change history entry"""
    email: str
    old_score: int
    new_score: int
    change: int
    description: str
    created_at: Optional[str] = None


class FeedbackCreate(BaseModel):
    """Feedback form submission"""
    email: str
    form: dict


class OngoingCourseProgress(BaseModel):
    id: Optional[str] = None
    title: str = "Basics of Stock Market"
    slug: Optional[str] = "basics-of-stock-market"
    current_lesson: int = 6
    total_lessons: int = 12
    progress_pct: int = 50


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    career_stage: Optional[str] = None
    financial_level: Optional[str] = None
    bio: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: Optional[str] = None
    user_sub: Optional[str] = None
    email: str
    display_name: str
    username: str
    career_stage: str
    financial_level: str
    bio: str
    fin_score: int = 500
    fin_stars: int = 0
    streak_count: int = 4
    rank: int = 1
    ongoing_course: Optional[OngoingCourseProgress] = None
    consistency_grid: list[int] = []

