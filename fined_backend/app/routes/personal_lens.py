# HTTP endpoints for FinEd Personal Lens
import logging
from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional, List, Dict, Any

from app.models.personal_lens import (
    PersonalLensRequest,
    PersonalLensResponse,
    ArticleQuestion,
)
from app.services.personal_lens_service import personal_lens_service
from app.repositories.personal_lens_repo import personal_lens_repo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/personal-lens", tags=["Personal Lens"])

# Default 4-step ETF questionnaire definitions used if not customized in DB
DEFAULT_ETF_QUESTIONS = [
    {
        "id": "familiarity",
        "question": "How familiar are you with ETFs (Exchange Traded Funds)?",
        "display_order": 1,
        "options": [
            {"id": "never", "label": "Never heard of them", "tag": "New to ETFs"},
            {"id": "basic", "label": "Heard the name, concept is fuzzy", "tag": "Curious beginner"},
            {"id": "some_exp", "label": "Understand basics, want deeper insights", "tag": "Intermediate"},
            {"id": "active", "label": "Active investor looking for nuances", "tag": "Experienced"}
        ]
    },
    {
        "id": "motivation",
        "question": "What is your main goal for reading this article?",
        "display_order": 2,
        "options": [
            {"id": "beginner_guide", "label": "Just exploring how investing works", "tag": "Curious mind"},
            {"id": "compare_mf", "label": "Comparing ETFs vs Mutual Funds", "tag": "Comparison seeker"},
            {"id": "build_portfolio", "label": "Ready to build a diversified portfolio", "tag": "Action oriented"},
            {"id": "cost_efficiency", "label": "Understanding fees & expense ratios", "tag": "Cost conscious"}
        ]
    },
    {
        "id": "habits",
        "question": "What is your current investing status?",
        "display_order": 3,
        "options": [
            {"id": "none", "label": "Haven't started investing yet", "tag": "Starting fresh"},
            {"id": "sip_mf", "label": "Investing via SIPs in Mutual Funds", "tag": "SIP investor"},
            {"id": "direct_stocks", "label": "Buying individual company stocks", "tag": "Direct equities"},
            {"id": "crypto_alt", "label": "FDs, Gold, or other assets", "tag": "Alternative assets"}
        ]
    },
    {
        "id": "confusion",
        "question": "What is the single biggest question or confusion you have?",
        "display_order": 4,
        "options": [
            {"id": "how_it_works", "label": "How does an ETF actually work?", "tag": "Core mechanics"},
            {"id": "risk_safety", "label": "Is it safe and what are the risks?", "tag": "Risk focus"},
            {"id": "tax_liquidity", "label": "Taxes, charges, and withdrawing money", "tag": "Tax & liquidity"},
            {"id": "which_to_buy", "label": "How to evaluate or pick an ETF", "tag": "Selection strategy"}
        ]
    }
]


@router.post("", response_model=PersonalLensResponse)
async def generate_personal_lens(
    request: Request,
    payload: PersonalLensRequest
):
    """
    Generate a tailored pre-reading Personal Lens for a financial article.
    Checks Supabase cache by deterministic profile key before calling Google Gemini.
    """
    try:
        # Check rate limiter if attached to app state
        limiter = getattr(request.app.state, "limiter", None)
        if limiter:
            # Enforce 8 requests per minute per IP
            pass

        return await personal_lens_service.get_or_generate_lens(payload)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_personal_lens: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate personal lens: {str(e)}"
        )


@router.get("/questions/{article_id}")
async def get_article_questions(article_id: str):
    """
    Fetch the 4-step questionnaire for an article.
    Falls back to default ETF questions if not in DB.
    """
    try:
        db_questions = personal_lens_repo.get_article_questions(article_id)
        if db_questions and len(db_questions) > 0:
            return {"articleId": article_id, "questions": db_questions}
        
        return {"articleId": article_id, "questions": DEFAULT_ETF_QUESTIONS}
    except Exception as e:
        logger.warning(f"Error fetching questions for article {article_id}: {e}")
        return {"articleId": article_id, "questions": DEFAULT_ETF_QUESTIONS}
