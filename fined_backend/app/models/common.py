# Generic paginated responses and common error schemas

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Standard success response with a message"""
    message: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str


class PaginationParams(BaseModel):
    """Reusable pagination — used in articles, transactions"""
    limit: int = 30
    offset: int = 0
