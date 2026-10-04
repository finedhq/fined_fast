from pydantic import BaseModel, model_validator
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
    title: str
    slug: Optional[str] = None
    current_lesson: Optional[int] = 0
    completed_modules: Optional[int] = 0
    total_lessons: Optional[int] = 0
    total_modules: Optional[int] = 0
    progress_pct: int = 0


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    career_stage: Optional[str] = None
    financial_level: Optional[str] = None
    knowledge_level: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = "Nagpur, IN"

    @model_validator(mode="before")
    @classmethod
    def resolve_financial_level(cls, data):
        if isinstance(data, dict):
            if data.get("financial_level") is None and data.get("knowledge_level") is not None:
                data["financial_level"] = data.get("knowledge_level")
        return data


class UserProfileResponse(BaseModel):
    id: Optional[str] = None
    user_sub: Optional[str] = None
    email: str
    display_name: str
    full_name: Optional[str] = None
    username: str
    career_stage: str
    financial_level: Optional[str] = None
    knowledge_level: Optional[str] = None
    bio: str
    location: Optional[str] = "Nagpur, IN"
    fin_score: int = 0
    finscore: Optional[int] = None
    fin_stars: int = 0
    finstars: Optional[int] = None
    streak_count: int = 0
    streak: Optional[int] = None
    rank: int = 1
    ongoing_course: Optional[OngoingCourseProgress] = None
    consistency_grid: list[int] = []
    activity_map: dict[str, int] = {}

    @model_validator(mode="before")
    @classmethod
    def sync_level_and_location(cls, data):
        if isinstance(data, dict):
            lvl = data.get("financial_level") or data.get("knowledge_level") or "Beginner (Level 1) - Starting with basics"
            data["financial_level"] = lvl
            data["knowledge_level"] = lvl
            if not data.get("location"):
                data["location"] = "Nagpur, IN"
        return data

