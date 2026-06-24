from fastapi import APIRouter, Depends
from app.dependencies import get_current_user, AuthUser

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/test")
async def test_auth(user: AuthUser = Depends(get_current_user)):
    """
    Test endpoint to verify that the Auth0 JWT token is successfully 
    decoded and validated by FastAPI.
    """
    return {
        "message": "Auth0 token successfully verified!",
        "user_email": user.email,
        "user_sub": user.sub,
        "roles": user.roles
    }
