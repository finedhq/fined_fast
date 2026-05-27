# Pydantic models for user alerts and feedback forms
from pydantic import BaseModel
from typing import Optional


class NotificationOut(BaseModel):
    """Maps to the notifications table"""
    id: Optional[str] = None
    email: str
    content: str
    seen: bool = False
    created_at: Optional[str] = None
