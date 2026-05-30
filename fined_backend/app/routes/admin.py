# HTTP endpoints for backoffice administrator operations
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.services.email_service import email_service
from app.repositories.article_repo import article_repo
from app.dependencies import get_current_user, require_admin, AuthUser

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Request Schemas ---

class NewsletterData(BaseModel):
    title: str
    content: str

class NewsletterRequest(BaseModel):
    data: NewsletterData

# --- Route Endpoints ---

@router.post("/newsletters")
async def send_newsletter(body: NewsletterRequest):
    """Admin: sends newsletter email to all subscribers concurrently"""
    try:
        # 1. Fetch all newsletter subscribers from DB
        import asyncio
        emails = await asyncio.to_thread(article_repo.get_all_newsletter_emails)
        
        if not emails:
            return {"message": "No subscribers found to send newsletter."}
            
        # 2. Dispatch emails concurrently using email_service (Latency Win 3)
        await email_service.send_bulk_newsletter(
            emails=emails,
            title=body.data.title,
            content=body.data.content
        )
        
        return {"message": "Newsletter sent to all."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send newsletter: {str(e)}"
        )
