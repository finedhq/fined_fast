# HTTP endpoints for reading and rating articles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.services.article_service import article_service
from app.integrations.storage import upload_to_supabase
from app.dependencies import get_current_user, require_admin, AuthUser
from app.repositories.personal_lens_repo import personal_lens_repo

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

@router.get("/related/{slug}")
async def get_related_articles(slug: str, limit: Optional[int] = 3):
    """Fetch related articles matching current article's category with fallback"""
    try:
        return article_service.get_related(slug, limit=limit or 3)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch related articles: {str(e)}"
        )

@router.post("/saveemail")
async def save_email(body: SaveEmailRequest, user: AuthUser = Depends(get_current_user)):
    """Save newsletter email subscription"""
    try:
        article_service.save_newsletter_email(user.email, body.entered_email)
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
        article_service.remove_newsletter_email(user.email, body.entered_email)
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
        return article_service.get_newsletter_email(user.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subscribed email: {str(e)}"
        )

@router.post("/updatetask")
async def update_task(body: UpdateTaskRequest, user: AuthUser = Depends(get_current_user)):
    """Mark article read to update user score/consistency metrics"""
    try:
        res = article_service.mark_read(user.email)
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

        rating_data = article_service.get_user_rating(user.email, body.article_id)
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
        article_service.rate(user.email, body.article_id, body.rating)
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

import json

@router.get("/admin/all")
async def get_all_articles_admin(
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
    status_filter: Optional[str] = None,
    user: AuthUser = Depends(require_admin)
):
    """Admin: Fetch all articles including drafts and scheduled articles"""
    try:
        return article_service.get_all_admin(limit=limit or 50, offset=offset or 0, status=status_filter)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin articles: {str(e)}"
        )

@router.post("/add")
async def add_article(
    title: str = Form(...),
    content: str = Form(...),
    description: Optional[str] = Form(None),
    seo_title: Optional[str] = Form(None),
    meta_description: Optional[str] = Form(None),
    tag: str = Form(...),
    slug: Optional[str] = Form(None),
    author_id: Optional[str] = Form(None),
    status_val: Optional[str] = Form("published", alias="status"),
    scheduled_at: Optional[str] = Form(None),
    editor_summary: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    metadata_json: Optional[str] = Form(None),
    questions: Optional[str] = Form(None),
    questions_json: Optional[str] = Form(None),
    difficulty: Optional[str] = Form(None),
    reading_time: Optional[str] = Form(None),
    target_audience: Optional[str] = Form(None),
    key_concepts: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user: AuthUser = Depends(require_admin)
):
    """Admin adds an article with optional scheduling, questions questionnaire, direct JSON metadata, custom slug, SEO fields, and optional image upload"""
    try:
        raw_meta = metadata or metadata_json
        parsed_metadata = {}
        if raw_meta:
            try:
                parsed_metadata = json.loads(raw_meta)
                if not isinstance(parsed_metadata, dict):
                    parsed_metadata = {"raw": parsed_metadata}
            except Exception:
                parsed_metadata = {}
        
        if difficulty:
            parsed_metadata["difficulty"] = difficulty
        if reading_time:
            parsed_metadata["readingTime"] = reading_time
        if target_audience:
            parsed_metadata["targetAudience"] = target_audience
        if key_concepts:
            concepts_list = [c.strip() for c in key_concepts.split(",") if c.strip()]
            parsed_metadata["keyConcepts"] = concepts_list

        raw_questions = questions or questions_json
        parsed_questions = []
        if raw_questions:
            try:
                parsed_questions = json.loads(raw_questions)
                if isinstance(parsed_questions, list):
                    parsed_metadata["questions"] = parsed_questions
            except Exception:
                pass

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
        new_article = article_service.add(
            title=title,
            content=content,
            description=description or "",
            image_url=image_url,
            tag=tag,
            slug=slug,
            author_id=author_id,
            seo_title=seo_title or "",
            meta_description=meta_description or "",
            status=status_val or "published",
            scheduled_at=scheduled_at if status_val == "scheduled" else None,
            editor_summary=editor_summary or "",
            metadata=parsed_metadata
        )
        
        # Save questions in article_questions table
        if parsed_questions and new_article and new_article.get("id"):
            try:
                personal_lens_repo.save_article_questions(new_article["id"], parsed_questions)
            except Exception:
                pass

        return new_article
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add article: {str(e)}"
        )

@router.post("/upload-image")
async def upload_article_image(
    image: UploadFile = File(...),
    subtitle: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    user: AuthUser = Depends(require_admin)
):
    """Admin uploads an image for an article directly into Supabase Storage"""
    try:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File provided is not a valid image."
            )
        file_bytes = await image.read()
        image_name_hint = subtitle or title or image.filename
        image_url = upload_to_supabase(
            file_bytes=file_bytes,
            filename=image.filename,
            mime_type=image.content_type,
            folder="articles",
            title=image_name_hint
        )
        return {
            "url": image_url,
            "filename": image.filename,
            "subtitle": subtitle or ""
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

