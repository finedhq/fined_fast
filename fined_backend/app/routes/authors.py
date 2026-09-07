from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.services.article_service import article_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/authors", tags=["Authors"])

@router.get("/")
def get_all_authors():
    """Fetch all authors (used for admin dropdowns)"""
    try:
        return article_service.get_all_authors()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch authors: {str(e)}"
        )

@router.get("/{slug}")
def get_author_profile(
    slug: str,
    limit: int = Query(default=12, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    """Fetch author details and paginated articles by author slug"""
    try:
        profile = article_service.get_author_profile(slug, limit=limit, offset=offset)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Author not found"
            )
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch author profile: {str(e)}"
        )

