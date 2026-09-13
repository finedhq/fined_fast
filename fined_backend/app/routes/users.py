# User profile routes for FinEd platform
import asyncio
import re
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user, AuthUser
from app.models.user import UserProfileResponse, UserProfileUpdate
from app.repositories.user_repo import user_repo

router = APIRouter(prefix="/v1/users", tags=["Users"])

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: AuthUser = Depends(get_current_user)):
    """
    Get current logged-in user's profile details, metrics, and course progress.
    """
    profile = await asyncio.to_thread(user_repo.get_profile, current_user.email, current_user.sub)
    return profile

@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(payload: UserProfileUpdate, current_user: AuthUser = Depends(get_current_user)):
    """
    Update username, career_stage, financial_level, and bio for current user.
    """
    update_data = payload.model_dump(exclude_unset=True)
    
    # Validate username if passed
    username = update_data.get("username")
    if username is not None:
        username = username.strip()
        if len(username) < 3 or len(username) > 30:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Username must be between 3 and 30 characters."
            )
        if not re.match(r"^[a-zA-Z0-9_]+$", username):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Username can only contain alphanumeric characters and underscores."
            )
        update_data["username"] = username

    updated_profile = await asyncio.to_thread(
        user_repo.update_profile, current_user.email, update_data
    )
    return updated_profile
