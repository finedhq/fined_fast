# Pydantic models for courses, modules, cards, and quizzes
from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class CourseOut(BaseModel):
    """Course as returned from DB"""
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: Optional[str] = None


class ModuleOut(BaseModel):
    """Module inside a course"""
    id: str
    course_id: str
    slug: str
    title: str
    description: Optional[str] = None
    order_index: int


class CardOut(BaseModel):
    """Individual learning card inside a module"""
    card_id: str
    module_id: str
    slug: str
    title: str
    content_type: str
    content_text: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    question_type: Optional[str] = None
    options: Optional[List[str]] = None
    options_tags: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    correct_answer_exists: Optional[bool] = None
    answer_compulsory: Optional[bool] = None
    allotted_finstars: Optional[int] = None
    finstars_involved: Optional[bool] = None
    order_index: int


class CardUpdate(BaseModel):
    """User completing a card — sent from frontend"""
    status: Literal["completed", "incompleted"]
    user_answer: Optional[str] = None
    fin_stars: Optional[int] = Field(default=None, ge=0)
    user_index: Optional[int] = None


class CourseCreate(BaseModel):
    """Admin: create a new course (thumbnail handled as file upload)"""
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    slug: Optional[str] = None


class ModuleCreate(BaseModel):
    """Admin: add module to a course"""
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    order_index: int = Field(ge=0)
    slug: Optional[str] = None
