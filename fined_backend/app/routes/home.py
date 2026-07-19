# HTTP endpoints for dashboard aggregates and leaderboards
import asyncio
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.services.home_service import home_service
from app.services.notification_service import notification_service
from app.repositories.article_repo import article_repo
from app.repositories.course_repo import course_repo
from app.repositories.user_repo import user_repo
from app.dependencies import get_current_user, AuthUser
from app.services.article_service import article_service

router = APIRouter(prefix="/home", tags=["Home"])

# --- Request Schemas ---

class FetchDataRequest(BaseModel):
    email: str
    userId: str

class NotificationsRequest(BaseModel):
    email: str

class FeedbackRequest(BaseModel):
    form: Dict[str, Any]

class RecommendationsRequest(BaseModel):
    email: str
    course_id: Optional[str] = None

class WaitlistRequest(BaseModel):
    email: str


# --- Route Endpoints ---

@router.post("/waitlist")
async def join_waitlist(body: WaitlistRequest):
    """Add an email to the waitlist."""
    try:
        # Note: Depending on your use case, this might be a thread-safe call
        # but supabase client is generally sync in Python unless using async client.
        import asyncio
        await asyncio.to_thread(article_service.save_waitlist_email, body.email)
        return {"message": "Successfully joined the waitlist"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join waitlist: {str(e)}"
        )

@router.post("/getdata")
async def fetch_data(body: FetchDataRequest, user: AuthUser = Depends(get_current_user)):
    """
    Main dashboard call returning stats, featured article,
    recommended courses, and ongoing course details.
    """
    try:
        # 1. Fetch dashboard stats first (must be sequential because it updates score/streak)
        stats = await asyncio.to_thread(
            home_service.get_dashboard, body.userId, body.email
        )

        ongoing_course_id = stats.get("ongoing_course_id")

        # 2. Define a small helper for the ongoing course fetch
        async def fetch_ongoing_course():
            if not ongoing_course_id:
                return None
            return await asyncio.to_thread(course_repo.get_by_id, ongoing_course_id)

        # 3. Run all independent DB queries sequentially (Thread-safe)
        articles = await asyncio.to_thread(article_repo.get_all, 1)
        courses = await asyncio.to_thread(course_repo.get_all)
        user_row = await asyncio.to_thread(user_repo.get_by_email, body.email)
        ongoing_course_data = await fetch_ongoing_course()
        log_data = await asyncio.to_thread(user_repo.get_score_logs, body.email)
        
        user_row = user_row or {}
        
        user_data = {
            "fin_stars": stats.get("fin_stars", 0),
            "streak_count": stats.get("streak_count", 1),
            "rank": stats.get("rank"),
            "ongoing_course_id": ongoing_course_id,
            "ongoing_module_id": user_row.get("ongoing_module_id"),
            "fin_score": stats.get("fin_score", 0)
        }
        
        return {
            "showFeedback": stats.get("show_feedback", False),
            "featuredArticle": articles[0] if articles else None,
            "recommendedCourses": courses[:8],
            "userData": user_data,
            "ongoingCourseData": ongoing_course_data,
            "logData": log_data
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )


@router.post("/notifications")
async def fetch_notifications(body: NotificationsRequest, user: AuthUser = Depends(get_current_user)):
    """Fetch notifications for a user — newest first"""
    try:
        return notification_service.get_all(body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notifications: {str(e)}"
        )


@router.post("/updatenotifications")
async def update_notifications(body: NotificationsRequest, user: AuthUser = Depends(get_current_user)):
    """Mark all unseen notifications as read"""
    try:
        notification_service.mark_all_seen(body.email)
        # Fetch updated notifications to return
        return notification_service.get_all(body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notifications: {str(e)}"
        )


@router.post("/hasunseen")
async def has_unseen(body: NotificationsRequest, user: AuthUser = Depends(get_current_user)):
    """Check if the user has any unseen notifications"""
    try:
        return notification_service.has_unseen(body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check unseen status: {str(e)}"
        )


@router.post("/finscorelog")
async def fetch_fin_score_log(body: FetchDataRequest, user: AuthUser = Depends(get_current_user)):
    """Get FinScore change logs for the user"""
    try:
        return user_repo.get_score_logs(body.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch score logs: {str(e)}"
        )


@router.get("/leaderboard")
async def fetch_leaderboard(user: AuthUser = Depends(get_current_user)):
    """Returns top 50 users ranked by FinScore"""
    try:
        # Maps to the array structure expected by the client Leaderboard
        raw_leaderboard = home_service.get_leaderboard()
        
        # Express maps columns user_sub, email, article_score, expense_score, course_score, consistency_score
        # and dynamically computes finScore. Let's make sure both properties are included!
        leaderboard_formatted = []
        for u in raw_leaderboard:
            fin_score = u.get("fin_score", 0)
            leaderboard_formatted.append({
                "user_sub": u.get("user_sub"),
                "email": u.get("email"),
                "article_score": u.get("article_score") or 0,
                "expense_score": u.get("expense_score") or 0,
                "course_score": u.get("course_score") or 0,
                "consistency_score": u.get("consistency_score") or 0,
                "finScore": fin_score  # React maps `entry.finScore`
            })
        return leaderboard_formatted
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch leaderboard: {str(e)}"
        )


@router.post("/feedback")
async def send_feedback(body: FeedbackRequest, user: AuthUser = Depends(get_current_user)):
    """Save user feedback submission"""
    try:
        email = body.form.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required in feedback form"
            )
        home_service.save_feedback(email, body.form)
        return {"message": "Feedback saved successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save feedback: {str(e)}"
        )


@router.post("/recommendations")
async def get_recommendations(body: RecommendationsRequest, user: AuthUser = Depends(get_current_user)):
    """Tag-based product recommendations matching current course tags"""
    try:
        recommendations = []
        
        # Sanitize course_id to check if it's a valid UUID format
        is_valid_uuid = False
        if body.course_id:
            try:
                import uuid
                uuid.UUID(body.course_id)
                is_valid_uuid = True
            except ValueError:
                pass

        if body.course_id and is_valid_uuid:
            try:
                recommendations = home_service.get_recommendations(body.email, body.course_id)
            except Exception as e:
                print(f"Failed to fetch course recommendations: {e}")
                pass
        else:
            try:
                # Check if there are stored recommended schemes in user profile
                user = user_repo.get_by_email(body.email)
                if user and user.get("recommended_schemes"):
                    from app.repositories.product_repo import product_repo
                    recommendations = product_repo.get_all_latest()[:3]
            except Exception as inner_e:
                print(f"Failed to fetch schemes from DB, using placeholders: {inner_e}")
                pass
                
        # Fallback placeholders if DB is empty, table doesn't exist, or no matching tags
        if not recommendations:
            recommendations = [
                {"id": "1", "bank_name": "HDFC Bank", "product_name": "MoneyBack+ Credit Card", "description": "Earn 10X CashPoints on Amazon, BigBasket, Flipkart, Reliance Smart SuperStore & Swiggy.", "tags": ["credit", "rewards"]},
                {"id": "2", "bank_name": "SBI Bank", "product_name": "SBI SimplySAVE", "description": "10 Reward Points per Rs.150 spent on Dining, Movies, Departmental Stores and Grocery.", "tags": ["credit", "shopping"]},
                {"id": "3", "bank_name": "ICICI Bank", "product_name": "iMobile Pay Savings", "description": "Zero balance account with exciting cashback offers on bill payments.", "tags": ["savings", "digital"]}
            ]
                
        # Format the scheme recommendations to match what HomePage.jsx maps:
        # e.g., bank_name, scheme_name, description
        formatted_recs = []
        for rec in recommendations:
            formatted_recs.append({
                "id": rec.get("id"),
                "bank_name": rec.get("bank_name", "FinEd"),
                "scheme_name": rec.get("product_name", rec.get("title", "Scheme")),
                "description": rec.get("description", rec.get("details", "")),
                "tags": rec.get("tags", [])
            })
            
        return {"recommendations": formatted_recs}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recommendations: {str(e)}"
        )
