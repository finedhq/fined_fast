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
async def send_newsletter(body: NewsletterRequest, user: AuthUser = Depends(require_admin)):
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

@router.get("/article-index-export")
async def export_article_index(user: AuthUser = Depends(require_admin)):
    """Admin: Generates a Markdown index of all articles for AI Project Knowledge"""
    import asyncio
    from fastapi import Response
    
    articles = await asyncio.to_thread(article_repo.get_all, limit=1000)
    
    # Group by tag
    grouped = {}
    for a in articles:
        tag = a.get("tag", "Uncategorized")
        if tag not in grouped:
            grouped[tag] = []
        grouped[tag].append(a)
    
    lines = [
        "# FinEd Article Database",
        "Use this index to find relevant articles to link to when drafting. Use the exact URL slug provided.",
        ""
    ]
    
    for tag, items in grouped.items():
        lines.append(f"## Category: {tag}")
        for item in items:
            title = item.get("title", "Untitled")
            # Generate fallback slug if missing (matches logic in article_service)
            slug = item.get("slug")
            if not slug:
                import re
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower().strip())
                slug = re.sub(r'^-+|-+$', '', slug)
                
            summary = item.get("description", "")
            lines.append(f"- **Title:** {title}")
            lines.append(f"  **URL:** `/articles/{slug}`")
            if summary:
                lines.append(f"  **Summary:** {summary.strip()}")
            lines.append("")
            
    md_content = "\n".join(lines)
    
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="fined_article_index.md"'}
    )
