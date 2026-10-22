# User profile routes for FinEd platform
import asyncio
import re
# pyrefly: ignore [missing-import]
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from app.dependencies import get_current_user, AuthUser
from app.models.user import UserProfileResponse, UserProfileUpdate
from app.repositories.push_repo import push_repo
from app.repositories.user_repo import user_repo
from app.services.account_service import AccountDeletionUnavailable, account_service

router = APIRouter(prefix="/v1/users", tags=["Users"])

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: AuthUser = Depends(get_current_user)):
    """
    Get current logged-in user's profile details, metrics, and course progress.
    """
    profile = await asyncio.to_thread(
        user_repo.get_profile, current_user.email, current_user.sub, current_user.name
    )
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
        user_repo.update_profile, current_user.email, update_data, current_user.sub
    )
    return updated_profile


# ── Mobile app: phone notifications (Phase 5) ──────────────────────────────

class PushTokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=4096)
    platform: Literal["android", "ios"] = "android"


class PushTokenOut(BaseModel):
    token: str = Field(min_length=10, max_length=4096)


@router.post("/me/push-tokens", status_code=status.HTTP_204_NO_CONTENT)
async def save_push_token(payload: PushTokenIn, current_user: AuthUser = Depends(get_current_user)):
    """The app registers this phone for notifications after the user allows them."""
    await asyncio.to_thread(push_repo.save, current_user.email, payload.token, payload.platform)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/me/push-tokens", status_code=status.HTTP_204_NO_CONTENT)
async def remove_push_token(payload: PushTokenOut, current_user: AuthUser = Depends(get_current_user)):
    """The app forgets this phone when the user signs out."""
    await asyncio.to_thread(push_repo.remove, current_user.email, payload.token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Account deletion (Phase 6; Google Play requires it in the app) ─────────

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(current_user: AuthUser = Depends(get_current_user)):
    """
    Permanently delete the signed-in user's account: progress, FinStars, certificates,
    notifications, feedback, ratings, newsletter sign-ups and their login. Cannot be undone.
    """
    if not current_user.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No account email on this login.")
    try:
        await asyncio.to_thread(account_service.delete_account, current_user.email, current_user.sub)
    except AccountDeletionUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account deletion isn't available right now. Please email us and we'll delete your account.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

