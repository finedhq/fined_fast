# HTTP endpoints for course cards
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import Optional, List
from app.services.course_service import course_service

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.get("/{moduleId}/getall")
async def get_cards_by_module(moduleId: str):
    """Get all cards for a module"""
    try:
        cards = course_service.get_cards(moduleId)
        return cards
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cards: {str(e)}"
        )

@router.delete("/{id}")
async def delete_card(id: str):
    """Delete a card"""
    try:
        course_service.delete_card(id)
        return {"message": "Card deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting card: {str(e)}"
        )

@router.post("/add/{moduleId}", status_code=status.HTTP_201_CREATED)
async def add_card(
    moduleId: str,
    title: str = Form(...),
    content_type: str = Form(...),
    content_text: Optional[str] = Form(None),
    question_type: Optional[str] = Form(None),
    correct_answer: Optional[str] = Form(None),
    allotted_finstars: str = Form(...),
    order_index: str = Form(...),
    answer_compulsory: Optional[str] = Form(None),
    feedback_type: Optional[str] = Form(None),
    options: Optional[List[str]] = Form(None),
    options_tags: Optional[List[str]] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None)
):
    """Admin adds a course card with optional multipart media uploads to Supabase storage"""
    try:
        media_urls = {}
        from app.integrations.storage import upload_to_supabase
        
        # Upload media if present
        if image_file:
            file_bytes = await image_file.read()
            media_urls["image_url"] = upload_to_supabase(
                file_bytes=file_bytes,
                filename=image_file.filename,
                mime_type=image_file.content_type,
                folder="images",
                title=title
            )
        if audio_file:
            file_bytes = await audio_file.read()
            media_urls["audio_url"] = upload_to_supabase(
                file_bytes=file_bytes,
                filename=audio_file.filename,
                mime_type=audio_file.content_type,
                folder="audios",
                title=title
            )
        if video_file:
            file_bytes = await video_file.read()
            media_urls["video_url"] = upload_to_supabase(
                file_bytes=file_bytes,
                filename=video_file.filename,
                mime_type=video_file.content_type,
                folder="videos",
                title=title
            )

        card_data = {
            "title": title,
            "content_type": content_type,
            "content_text": content_text or "",
            "order_index": int(order_index),
            "allotted_finstars": int(allotted_finstars),
            **media_urls
        }

        if content_type == "question":
            card_data.update({
                "question_type": question_type,
                "options": options or [],
                "options_tags": options_tags or [],
                "correct_answer": correct_answer,
                "answer_compulsory": answer_compulsory in ["true", True],
                "feedback_type": feedback_type,
                "correct_answer_exists": bool(correct_answer),
                "finstars_involved": True,
            })
        else:
            card_data.update({
                "question_type": None,
                "options": None,
                "options_tags": None,
                "correct_answer": None,
                "answer_compulsory": None,
                "feedback_type": None,
                "correct_answer_exists": None,
                "finstars_involved": None,
            })

        return course_service.add_card(moduleId, card_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding card: {str(e)}"
        )
