# HTTP endpoints for contact and feedback inquiries
from fastapi import APIRouter, HTTPException, status, Depends
from app.dependencies import get_current_user, AuthUser
from pydantic import BaseModel
from app.services.contact_service import contact_service

router = APIRouter(prefix="/contact", tags=["Contact"])

class ContactQueryRequest(BaseModel):
    name: str
    email: str
    message: str

@router.post("/user")
async def contact_user(body: ContactQueryRequest, user: AuthUser = Depends(get_current_user)):
    """Save user support request query"""
    # Mimic strict validation from original Express backend
    if not body.name or not body.email or not body.message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All fields are required."
        )
    try:
        contact_service.save_query(
            name=body.name,
            email=body.email,
            message=body.message
        )
        return {"message": "Your message has been received!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save message: {str(e)}"
        )
