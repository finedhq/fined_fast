# HTTP endpoints for reading and rating articles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.services.article_service import article_service
from app.integrations.storage import upload_to_supabase
from app.dependencies import get_current_user, require_admin, AuthUser

router = APIRouter(prefix="/articles", tags=["Articles"])

# --- Request Schemas ---

class GetAllArticlesRequest(BaseModel):
    limit: Optional[int] = 30
    offset: Optional[int] = 0
    tag: Optional[str] = None

class SaveEmailRequest(BaseModel):
    email: str
    entered_email: str = Field(alias="enteredEmail")

    class Config:
        populate_by_name = True

class RemoveEmailRequest(BaseModel):
    email: str
    entered_email: str = Field(alias="enteredEmail")

    class Config:
        populate_by_name = True

class GetEnteredEmailRequest(BaseModel):
    email: str

class UpdateTaskRequest(BaseModel):
    email: str

class FetchRatingRequest(BaseModel):
    email: str
    article_id: str = Field(alias="articleId")

    class Config:
        populate_by_name = True

class RateRequest(BaseModel):
    email: str
    article_id: str = Field(alias="articleId")
    rating: float = Field(ge=1, le=5)

    class Config:
        populate_by_name = True


# --- Route Endpoints ---

@router.post("/getall")
async def get_all_articles(body: Optional[GetAllArticlesRequest] = None):
    """Fetch all articles — public"""
    try:
        limit = body.limit if body and body.limit is not None else 30
        offset = body.offset if body and body.offset is not None else 0
        tag = body.tag if body else None
        return article_service.get_all(limit=limit, offset=offset, tag=tag)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch articles: {str(e)}"
        )

@router.get("/slug/{slug}")
async def get_article_by_slug(slug: str):
    """Fetch a specific article by its slug"""
    try:
        article = article_service.get_by_slug(slug)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )
        return article
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch article: {str(e)}"
        )

@router.get("/adjacent/{slug}")
async def get_adjacent_articles(slug: str):
    """Fetch previous and next articles relative to the given slug"""
    try:
        return article_service.get_adjacent(slug)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch adjacent articles: {str(e)}"
        )

@router.post("/saveemail")
async def save_email(body: SaveEmailRequest, user: AuthUser = Depends(get_current_user)):
    """Save newsletter email subscription"""
    try:
        article_service.save_newsletter_email(body.email, body.entered_email)
        return {"message": "Email saved successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save newsletter email: {str(e)}"
        )

@router.post("/removeemail")
async def remove_email(body: RemoveEmailRequest, user: AuthUser = Depends(get_current_user)):
    """Remove newsletter email subscription"""
    try:
        article_service.remove_newsletter_email(body.email, body.entered_email)
        return {"message": "Email removed successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove newsletter email: {str(e)}"
        )

@router.post("/getenteredemail")
async def get_entered_email(body: GetEnteredEmailRequest, user: AuthUser = Depends(get_current_user)):
    """Get newsletter email subscribed by the user"""
    try:
        return article_service.get_newsletter_email(body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subscribed email: {str(e)}"
        )

@router.post("/updatetask")
async def update_task(body: UpdateTaskRequest, user: AuthUser = Depends(get_current_user)):
    """Mark article read to update user score/consistency metrics"""
    try:
        res = article_service.mark_read(body.email)
        if not res.get("updated", False):
            return res
        # Match Javascript response keys (Express: articleCount, pointsEarned, newScore)
        return {
            "updated": True,
            "articleCount": res.get("article_count", 0),
            "pointsEarned": res.get("points_earned", 0),
            "streak": res.get("streak", 1),
            "bonus": res.get("bonus", 0),
            "penalty": res.get("penalty", 0),
            "newScore": res.get("new_score", 0)  # Correctly return user's updated article score
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}"
        )

@router.post("/fetchrating")
async def fetch_rating(body: FetchRatingRequest, user: AuthUser = Depends(get_current_user)):
    """Get this user's rating for a specific article"""
    try:
        # Validate article_id is a valid UUID
        import uuid
        try:
            uuid.UUID(body.article_id)
        except ValueError:
            return {"rating": 0}

        rating_data = article_service.get_user_rating(body.email, body.article_id)
        # Returns user rating or standard placeholder matching React expectations
        return rating_data if rating_data else {"rating": 0}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch article rating: {str(e)}"
        )

@router.post("/rate")
async def rate_article(body: RateRequest, user: AuthUser = Depends(get_current_user)):
    """Save or update rating, recalculate article average"""
    # Validate article_id is a valid UUID
    import uuid
    try:
        uuid.UUID(body.article_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid article ID format. Must be a valid UUID."
        )

    try:
        article_service.rate(body.email, body.article_id, body.rating)
        return {"message": "Rating saved."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rate article: {str(e)}"
        )

@router.delete("/{id}")
async def delete_article(id: str, user: AuthUser = Depends(require_admin)):
    """Admin deletes an article"""
    # Validate article_id is a valid UUID
    import uuid
    try:
        uuid.UUID(id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid article ID format. Must be a valid UUID."
        )

    try:
        article_service.delete(id)
        return {"message": "Article deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete article: {str(e)}"
        )

@router.post("/add")
async def add_article(
    title: str = Form(...),
    content: str = Form(...),
    description: Optional[str] = Form(None),
    tag: str = Form(...),
    author_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user: AuthUser = Depends(require_admin)
):
    """Admin adds an article with optional image upload to Supabase Storage"""
    try:
        image_url = ""
        if image:
            file_bytes = await image.read()
            image_url = upload_to_supabase(
                file_bytes=file_bytes,
                filename=image.filename,
                mime_type=image.content_type,
                folder="articles",
                title=title
            )
        return article_service.add(title=title, content=content, description=description or "", image_url=image_url, tag=tag, author_id=author_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add article: {str(e)}"
        )
