from fastapi import APIRouter, Depends, HTTPException, status
from app.services.article_service import article_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/authors", tags=["Authors"])

@router.get("/")
async def get_all_authors():
    """Fetch all authors (used for admin dropdowns)"""
    try:
        return article_service.get_all_authors()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch authors: {str(e)}"
        )

@router.get("/{slug}")
async def get_author_profile(slug: str):
    """Fetch author details and all their articles by slug"""
    try:
        author = article_service.get_author_by_slug(slug)
        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Author not found"
            )
        
        articles = article_service.get_articles_by_author(author["id"])
        
        return {
            "author": author,
            "articles": articles
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch author profile: {str(e)}"
        )
