# Pydantic models for articles and star ratings
from pydantic import BaseModel, Field
from typing import Optional


class ArticleOut(BaseModel):
    """Article as returned from DB"""
    id: str
    title: str
    content: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    rating: Optional[float] = None
    created_at: Optional[str] = None


class ArticleCreate(BaseModel):
    """Admin: create a new article (image handled separately as file upload)"""
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=10)


class RatingCreate(BaseModel):
    """User rating an article"""
    article_id: str
    rating: float = Field(ge=1, le=5)


class NewsletterEmailSave(BaseModel):
    """Save newsletter subscription"""
    entered_email: str = Field(min_length=5, max_length=100)


class ReadingTaskResponse(BaseModel):
    """Response when user reads an article"""
    updated: bool
    message: Optional[str] = None
    article_count: Optional[int] = None
    points_earned: Optional[int] = None
    streak: Optional[int] = None
    bonus: Optional[int] = None
    penalty: Optional[int] = None
