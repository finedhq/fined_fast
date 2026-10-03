# HTTP endpoints for educational courses and quiz submissions
import asyncio
import re
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Dict, Any, List

from app.integrations.storage import upload_to_supabase
from app.integrations.supabase_client import supabase
from app.dependencies import get_current_user, get_optional_current_user, require_admin, AuthUser
from app.models.card_data import validate_card_data
from app.repositories.course_repo import course_repo
from app.services.course_visibility import (
    COURSE_STATUSES, can_view_course, can_view_module, course_can_complete, course_status, is_listed,
    is_released, visible_modules,
)
from app.services.course_authoring import checked_slug, require_draft_module, require_free_slug, slug_from_title

router = APIRouter(prefix="/courses", tags=["Courses"])


def _is_valid_uuid(value: str) -> bool:
    """Check whether value parses as a UUID, so it's safe to pass to .eq('id'/'card_id', ...) — avoids Postgres 22P02 (invalid input syntax for type uuid) when a slug is queried as an id."""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


async def _hidden_from(course_id: str, user: AuthUser) -> bool:
    """True if course_id is a course this user may not open (a draft, for non-admins)."""
    course = await asyncio.to_thread(course_repo.get_by_id, course_id)
    return course is not None and not can_view_course(course, user)


async def _hidden_module_from(module_id: str, user: AuthUser) -> bool:
    """True if the module is not released yet, or belongs to a course this
    user may not open (both only for non-admins)."""
    module = await asyncio.to_thread(course_repo.get_module_by_id, module_id)
    if module is None:
        return False
    return not can_view_module(module, user) or await _hidden_from(module.get("course_id"), user)

# --- Request Schemas ---

class GetOngoingCourseRequest(BaseModel):
    email: str

class GetCourseRequest(BaseModel):
    email: str

class GetCardRequest(BaseModel):
    email: str

class UpdateCardRequest(BaseModel):
    status: str
    userAnswer: Optional[str] = None
    email: str
    finStars: Optional[int] = None
    userIndex: Optional[int] = None


# --- Route Endpoints ---

@router.post("/add")
async def add_course(
    title: str = Form(...),
    description: str = Form(...),
    modules_count: str = Form(...),
    duration: str = Form(...),
    thumbnail_file: Optional[UploadFile] = File(None),
    course_status_value: str = Form("draft", alias="status"),
    user: AuthUser = Depends(require_admin)
):
    """Admin: Adds a new course pathway with optional thumbnail upload.
    New courses start as drafts (hidden) unless a status is sent."""
    if course_status_value not in COURSE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"status must be one of {', '.join(COURSE_STATUSES)}",
        )
    try:
        thumbnail_url = ""
        if thumbnail_file:
            file_bytes = await thumbnail_file.read()
            thumbnail_url = upload_to_supabase(
                file_bytes=file_bytes,
                filename=thumbnail_file.filename,
                mime_type=thumbnail_file.content_type,
                folder="thumbnails",
                title=title
            )
        
        # Generate slug
        slug = title.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_-]+', '-', slug)
        
        # Insert course row
        row = {
            "title": title,
            "description": description,
            "modules_count": int(modules_count),
            "duration": int(duration),
            "thumbnail_url": thumbnail_url,
            "slug": slug,
            "status": course_status_value,
        }
        if course_status_value == "published":
            row["published_at"] = datetime.utcnow().isoformat() + "Z"
        res = await asyncio.to_thread(lambda: supabase.from_("courses").insert([row]).execute())
        
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add course: {str(e)}"
        )


@router.get("/getall")
async def get_all_courses():
    """Fetch all published courses — public"""
    try:
        return await asyncio.to_thread(course_repo.get_listed)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.get("/admin/all")
async def get_all_courses_admin(user: AuthUser = Depends(require_admin)):
    """Admin: every course, any status, newest first"""
    try:
        courses = await asyncio.to_thread(course_repo.get_all)
        return [{**c, "status": course_status(c)} for c in courses]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch courses: {str(e)}"
        )


@router.delete("/{id}")
async def delete_course(id: str, user: AuthUser = Depends(require_admin)):
    """Admin: Delete a course"""
    if not _is_valid_uuid(id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    try:
        await asyncio.to_thread(lambda: supabase.from_("courses").delete().eq("id", id).execute())
        return {"message": "Course deleted successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )


@router.post("/getongoingcourse")
async def get_ongoing_course(body: GetOngoingCourseRequest, user: AuthUser = Depends(get_optional_current_user)):
    """Fetch user's current in-progress course"""
    try:
        # Get user's ongoing course ID
        user_res = await asyncio.to_thread(lambda: supabase.from_("users").select("ongoing_course_id").eq("email", user.email).limit(1).execute())
        user_data = user_res.data[0] if user_res and user_res.data else None
        course_id = user_data.get("ongoing_course_id") if user_data else None
        
        if not course_id:
            return {"error": "No ongoing course found for this user."}
            
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", course_id).limit(1).execute())
        # Only a published course is "continue learning" — not a draft, and not
        # an archived course that was replaced (it still opens by old links).
        if course_res and course_res.data and not is_listed(course_res.data[0]):
            return {"error": "No ongoing course found for this user."}
        if not (course_res and course_res.data):
            return {}
        return (await asyncio.to_thread(course_repo.with_released_counts, [course_res.data[0]]))[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch ongoing course: {str(e)}"
        )


@router.post("/course/{course_slug}")
async def get_a_course(course_slug: str, body: GetCourseRequest, user: AuthUser = Depends(get_optional_current_user)):
    """
    Fetch course overview with modules and card completion progress.
    Optimized: consolidated card lookups and executed in parallel.
    """
    try:
        # Sequential database requests (Thread-safe)
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("slug", course_slug).execute())
        if not course_res.data and _is_valid_uuid(course_slug):
            course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", course_slug).execute())

        # A draft looks exactly like a missing course to non-admins
        if not course_res.data or not can_view_course(course_res.data[0], user):
            return {"title": "", "description": "", "data": []}
            
        course_id = course_res.data[0]["id"]
        course_title = course_res.data[0]["title"]
        course_description = course_res.data[0].get("description", "")
        thumbnail_url = course_res.data[0].get("thumbnail_url", "")
            
        modules_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("*").eq("course_id", course_id).order("order_index").execute())
        progress_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id, status").eq("email", user.email).eq("progress_type", "card").execute())
        
        modules = visible_modules(modules_res.data or [], user)  # modules not released yet stay hidden
        if not modules:
            return {"title": course_title, "description": course_description, "data": []}
            
        # Optimization: Fetch only cards belonging to the modules in this course (Latency Win 1)
        module_ids = [m["id"] for m in modules]
        cards_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id, title, card_template, order_index, slug").in_("module_id", module_ids).execute())
        cards = cards_res.data or []
        
        # Build user progress map
        progress_map = {item["card_id"]: item["status"] for item in (progress_res.data or [])}
        
        # Group cards by module in memory
        cards_by_module = {}
        for card in cards:
            mod_id = card["module_id"]
            if mod_id not in cards_by_module:
                cards_by_module[mod_id] = []
            
            cards_by_module[mod_id].append({
                "card_id": card["card_id"],
                "cardSlug": card.get("slug"),
                "module_id": card["module_id"],
                "title": card["title"],
                "content_text": card.get("content_text"),
                "content_type": card.get("content_type") or card.get("card_template"),
                "order_index": card["order_index"],
                "image_url": card.get("image_url"),
                "status": progress_map.get(card["card_id"], "incompleted")
            })
            
        # Combine modules with sorted cards
        formatted_data = []
        for module in modules:
            mod_id = module["id"]
            module_cards = cards_by_module.get(mod_id, [])
            module_cards.sort(key=lambda x: x["order_index"])
            formatted_data.append({
                "moduleTitle": module["title"],
                "moduleId": mod_id,
                "moduleSlug": module.get("slug"),
                "moduleDescription": module.get("description"),
                "cards": module_cards
            })
            
        result = {"title": course_title, "description": course_description, "thumbnail_url": thumbnail_url, "data": formatted_data}
        # A course released module by module says how many modules it will have,
        # so the page's certificate waits for all of them (sent only when set).
        planned = course_res.data[0].get("planned_modules")
        if planned is not None:
            result["planned_modules"] = planned
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch course detail: {str(e)}"
        )


# ── FinStar defaults per card type (used when admin omits allotted_finstars) ──
DEFAULT_FINSTARS: dict[str, int] = {
    "cinematic": 0,
    "concept": 2,
    "chart": 2,
    "scenario": 3,
    "risk_spectrum": 2,
    "slider_calculator": 2,
    "pill_selector": 3,
    "interactive": 2,
    "quiz": 10,
    "completion": 0,
    "narrative": 0,
    "hero": 0,
    "model": 10,
}

# For these card types the server decides the stars (from the card itself) and
# ignores the amount the browser sends. Older types keep today's behaviour.
SERVER_STARS_TEMPLATES = {"narrative", "hero", "model"}

def get_card_finstars(card_data: dict, card_template: str) -> int:
    """Return allotted_finstars for a card, falling back to the template default."""
    val = card_data.get("allotted_finstars")
    if val is None:
        return DEFAULT_FINSTARS.get(card_template, 2)
    return int(val)


async def _noop():
    return None


async def _build_bundle_response(course_id: str, course_title: str, course_slug: str, module_id: str, module_title: str, module_order: int, user_email: str, write_ongoing: bool = True, viewer: AuthUser = None):
    # 1. Parallel lookups: cards, user progress, course modules, ongoing state
    #    (draft previews don't move the viewer's "continue learning" pointer)
    cards_res, progress_res, modules_res, _ = await asyncio.gather(
        asyncio.to_thread(lambda: supabase.from_("cards").select("*").eq("module_id", module_id).order("order_index").execute()),
        asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id, status, user_answer").match({
            "email": user_email,
            "module_id": module_id,
            "progress_type": "card"
        }).execute()),
        asyncio.to_thread(lambda: supabase.from_("modules").select("*").eq("course_id", course_id).order("order_index").execute()),
        asyncio.to_thread(lambda: supabase.from_("users").update({
            "ongoing_module_id": module_id,
            "ongoing_course_id": course_id
        }).eq("email", user_email).execute()) if write_ongoing else _noop()
    )

    all_cards = cards_res.data or []
    progress_map = {row["card_id"]: row for row in (progress_res.data or [])}

    # 2. Adjacent modules navigation lookup (a module not released yet is never
    #    "Up next" for learners; admins previewing it still get their bearings)
    modules = modules_res.data or []
    modules = [m for m in modules if m["id"] == module_id or can_view_module(m, viewer)]
    module_index = next((i for i, m in enumerate(modules) if m["id"] == module_id), -1)
    prev_module = modules[module_index - 1] if module_index > 0 else None
    next_module = modules[module_index + 1] if module_index < len(modules) - 1 else None

    prev_module_first_card = None
    next_module_first_card = None

    nav_queries = []
    if prev_module:
        nav_queries.append(asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, slug").eq("module_id", prev_module["id"]).order("order_index").limit(1).execute()))
    if next_module:
        nav_queries.append(asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, slug").eq("module_id", next_module["id"]).order("order_index").limit(1).execute()))

    if nav_queries:
        nav_results = await asyncio.gather(*nav_queries)
        nav_idx = 0
        if prev_module:
            prev_cards = nav_results[nav_idx].data
            if prev_cards:
                prev_module_first_card = {
                    "moduleId": prev_module["id"],
                    "moduleSlug": prev_module.get("slug"),
                    "cardId": prev_cards[0]["card_id"],
                    "cardSlug": prev_cards[0].get("slug")
                }
            nav_idx += 1
        if next_module:
            next_cards = nav_results[nav_idx].data
            if next_cards:
                next_module_first_card = {
                    "moduleId": next_module["id"],
                    "moduleSlug": next_module.get("slug"),
                    "cardId": next_cards[0]["card_id"],
                    "cardSlug": next_cards[0].get("slug")
                }

    # Package cards with user progress attached
    cards_packaged = []
    for idx, c in enumerate(all_cards):
        c_prog = progress_map.get(c["card_id"], {})
        cards_packaged.append({
            **c,
            "status": c_prog.get("status", "incompleted"),
            "userAnswer": c_prog.get("user_answer"),
            "prevCardId": all_cards[idx - 1]["card_id"] if idx > 0 else None,
            "prevCardSlug": all_cards[idx - 1].get("slug") if idx > 0 else None,
            "nextCardId": all_cards[idx + 1]["card_id"] if idx < len(all_cards) - 1 else None,
            "nextCardSlug": all_cards[idx + 1].get("slug") if idx < len(all_cards) - 1 else None,
            "isFirstCardInModule": idx == 0,
            "isLastCardInModule": idx == len(all_cards) - 1,
        })

    return {
        "course_id": course_id,
        "course_title": course_title,
        "course_slug": course_slug,
        "module_id": module_id,
        "module_title": module_title,
        "module_order_index": module_order,
        "module_total_cards": len(all_cards),
        "cards": cards_packaged,
        "prevModuleFirstCard": prev_module_first_card,
        "nextModuleFirstCard": next_module_first_card
    }


@router.post("/course/{course_slug}/module/{module_slug}/bundle")
async def get_module_bundle(course_slug: str, module_slug: str, body: GetCardRequest, user: AuthUser = Depends(get_current_user)):
    """
    Fetch all cards, user progress, and adjacent module navigation for an entire module in a single shot.
    Enables zero-latency client-side card transitions.
    """
    try:
        # Resolve course_slug
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("slug", course_slug).execute())
        if not course_res.data and _is_valid_uuid(course_slug):
            course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", course_slug).execute())
        if not course_res.data or not can_view_course(course_res.data[0], user):
            raise HTTPException(status_code=404, detail="Course not found")
        course_id = course_res.data[0]["id"]
        course_title = course_res.data[0].get("title")
        c_slug_real = course_res.data[0].get("slug")

        # Resolve module_slug
        module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id, title, slug, order_index, course_id").eq("slug", module_slug).execute())
        if not module_res.data and _is_valid_uuid(module_slug):
            module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id, title, slug, order_index, course_id").eq("id", module_slug).execute())
        if not module_res.data:
            raise HTTPException(status_code=404, detail="Module not found")
        module_course_id = module_res.data[0].get("course_id")
        if module_course_id != course_id and await _hidden_from(module_course_id, user):
            raise HTTPException(status_code=404, detail="Module not found")
        module_id = module_res.data[0]["id"]
        module_title = module_res.data[0].get("title")
        module_order = module_res.data[0].get("order_index", 0)
        module_row = await asyncio.to_thread(course_repo.get_module_by_id, module_id)
        if not can_view_module(module_row, user):
            raise HTTPException(status_code=404, detail="Module not found")

        is_draft = not is_listed(course_res.data[0]) or not is_released(module_row)  # draft/archived courses and unreleased modules never become "continue learning"
        return await _build_bundle_response(course_id, course_title, c_slug_real, module_id, module_title, module_order, user.email, write_ongoing=not is_draft, viewer=user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch module bundle: {str(e)}"
        )


@router.post("/card/{card_slug}/bundle")
async def get_bundle_by_card_slug(card_slug: str, body: GetCardRequest, user: AuthUser = Depends(get_current_user)):
    """
    Fetch module bundle directly via a unique card slug.
    """
    try:
        # Resolve card to get module_id
        card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("module_id").eq("slug", card_slug).execute())
        if not card_res.data and _is_valid_uuid(card_slug):
            card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("module_id").eq("card_id", card_slug).execute())
        if not card_res.data:
            raise HTTPException(status_code=404, detail="Card not found")
        m_id = card_res.data[0]["module_id"]

        # Resolve module to get course_id
        module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id, title, slug, order_index, course_id").eq("id", m_id).execute())
        if not module_res.data:
            raise HTTPException(status_code=404, detail="Module not found")
        m_title = module_res.data[0].get("title")
        m_order = module_res.data[0].get("order_index", 0)
        c_id = module_res.data[0]["course_id"]

        # Resolve course to get details
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", c_id).execute())
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if not can_view_course(course_res.data[0], user):
            raise HTTPException(status_code=404, detail="Card not found")
        module_row = await asyncio.to_thread(course_repo.get_module_by_id, m_id)
        if not can_view_module(module_row, user):
            raise HTTPException(status_code=404, detail="Card not found")
        c_title = course_res.data[0].get("title")
        c_slug_real = course_res.data[0].get("slug")

        is_draft = not is_listed(course_res.data[0]) or not is_released(module_row)  # draft/archived courses and unreleased modules never become "continue learning"
        return await _build_bundle_response(c_id, c_title, c_slug_real, m_id, m_title, m_order, user.email, write_ongoing=not is_draft, viewer=user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch module bundle by card: {str(e)}"
        )


@router.post("/course/{course_slug}/module/{module_slug}/card/{card_slug}")
async def get_a_card(course_slug: str, module_slug: str, card_slug: str, body: GetCardRequest, user: AuthUser = Depends(get_current_user)):
    """
    Fetch card metadata and adjacent navigation indicators.
    Optimized: Released event loop and parallelized I/O lookups.
    """
    try:
        # Resolve slugs to IDs
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("slug", course_slug).execute())
        if not course_res.data and _is_valid_uuid(course_slug):
            course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("*").eq("id", course_slug).execute())
        if not course_res.data or not can_view_course(course_res.data[0], user):
            raise HTTPException(status_code=404, detail="Course not found")
        course_id = course_res.data[0]["id"]
        is_draft = not is_listed(course_res.data[0])  # draft or archived: never "continue learning"

        module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("slug", module_slug).execute())
        if not module_res.data and _is_valid_uuid(module_slug):
            module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("id", module_slug).execute())
        if not module_res.data:
            raise HTTPException(status_code=404, detail="Module not found")
        module_id = module_res.data[0]["id"]

        card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("slug", card_slug).execute())
        if not card_res.data and _is_valid_uuid(card_slug):
            card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("card_id", card_slug).execute())
        if not card_res.data:
            raise HTTPException(status_code=404, detail="Card not found")
        card_id = card_res.data[0]["card_id"]
        # Slugs are looked up globally, so also check the course the card really belongs to
        if await _hidden_module_from(module_id, user) or await _hidden_module_from(card_res.data[0].get("module_id"), user):
            raise HTTPException(status_code=404, detail="Card not found")

        # 1. Fetch current cards, user progress, and update active state sequentially (Thread-safe)
        cards_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("*").eq("module_id", module_id).order("order_index").execute())
        progress_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("status, user_answer").match({
            "email": user.email,
            "module_id": module_id,
            "card_id": card_id,
            "progress_type": "card"
        }).limit(1).execute())
        module_row = await asyncio.to_thread(course_repo.get_module_by_id, module_id)
        if not is_draft and is_released(module_row):
            await asyncio.to_thread(lambda: supabase.from_("users").update({
                "ongoing_module_id": module_id,
                "ongoing_course_id": course_id
            }).eq("email", user.email).execute())
        modules_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("*").eq("course_id", course_id).order("order_index").execute())
        
        all_cards = cards_res.data or []
        current_index = next((i for i, c in enumerate(all_cards) if c["card_id"] == card_id), -1)
        if current_index == -1:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
            
        current_card = all_cards[current_index]
        user_progress = progress_res.data[0] if progress_res and progress_res.data else {}
        
        # 2. Adjacent modules navigation lookup (modules not released yet are skipped for learners)
        modules = [m for m in (modules_res.data or []) if m["id"] == module_id or can_view_module(m, user)]
        # same fields as before (this route never returned module slugs)
        modules = [{k: m.get(k) for k in ("id", "title", "order_index")} for m in modules]
        module_index = next((i for i, m in enumerate(modules) if m["id"] == module_id), -1)
        current_module_title = modules[module_index]["title"] if module_index != -1 else None
        current_module_order = modules[module_index]["order_index"] if module_index != -1 else 0
        
        prev_module = modules[module_index - 1] if module_index > 0 else None
        next_module = modules[module_index + 1] if module_index < len(modules) - 1 else None
        
        prev_module_first_card = None
        next_module_first_card = None
        
        nav_results = []
        if prev_module:
            nav_results.append(await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", prev_module["id"]).order("order_index").limit(1).execute()))
        if next_module:
            nav_results.append(await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", next_module["id"]).order("order_index").limit(1).execute()))
        
        nav_idx = 0
        if prev_module:
            prev_cards = nav_results[nav_idx].data
            if prev_cards:
                prev_module_first_card = {"moduleId": prev_module["id"], "moduleSlug": prev_module.get("slug"), "cardId": prev_cards[0]["card_id"], "cardSlug": None}
            nav_idx += 1
            
        if next_module:
            next_cards = nav_results[nav_idx].data
            if next_cards:
                next_module_first_card = {"moduleId": next_module["id"], "moduleSlug": next_module.get("slug"), "cardId": next_cards[0]["card_id"], "cardSlug": None}
                
        # For completion cards: compute the user's actual earned FinStars for this module
        card_data_dict = current_card.get("card_data") or {}
        if current_card.get("card_template") == "completion":
            try:
                # Fetch completed cards in this module for the user
                completed_res = await asyncio.to_thread(lambda: supabase.from_("userCourses")
                    .select("card_id, user_answer")
                    .match({"email": user.email, "module_id": module_id, "progress_type": "card", "status": "completed"})
                    .execute())
                completed_map = {row["card_id"]: row.get("user_answer") for row in (completed_res.data or [])}

                # Sum allotted_finstars from card_data for those completed cards
                earned = 0
                for c in all_cards:
                    if c["card_id"] in completed_map:
                        cd = c.get("card_data") or {}
                        finstars = get_card_finstars(cd, c.get("card_template", ""))
                        
                        if cd.get("card_type") == "quiz":
                            user_ans = completed_map[c["card_id"]]
                            opts = cd.get("options", [])
                            is_correct = any(opt.get("id") == user_ans and opt.get("is_correct") for opt in opts)
                            if not is_correct:
                                finstars = 0
                                
                        earned += finstars

                # Inject real total into card_data (overrides the admin-set static value)
                card_data_dict = {**card_data_dict, "total_finstars": earned}
            except Exception:
                pass  # Silently fall back to whatever is stored in card_data

        return {
            **current_card,
            "card_data": card_data_dict,
            "status": user_progress.get("status", "incompleted"),
            "userAnswer": user_progress.get("user_answer"),
            "prevCardId": all_cards[current_index - 1]["card_id"] if current_index > 0 else None,
            "prevCardSlug": all_cards[current_index - 1].get("slug") if current_index > 0 else None,
            "nextCardId": all_cards[current_index + 1]["card_id"] if current_index < len(all_cards) - 1 else None,
            "nextCardSlug": all_cards[current_index + 1].get("slug") if current_index < len(all_cards) - 1 else None,
            "module_total_cards": len(all_cards),
            "module_title": current_module_title,
            "module_order_index": current_module_order,
            "module_progress": current_card.get("order_index", 0),
            "isFirstCardInModule": current_index == 0,
            "isLastCardInModule": current_index == len(all_cards) - 1,
            "prevModuleFirstCard": prev_module_first_card,
            "nextModuleFirstCard": next_module_first_card
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch card detail: {str(e)}"
        )


@router.post("/course/{course_id}/module/{module_id}/card/{card_id}/updateCard")
async def update_a_card(course_id: str, module_id: str, card_id: str, body: UpdateCardRequest, user: AuthUser = Depends(get_current_user)):
    """
    Updates the completion status of a card. 
    Triggers consistency rewards, module completion scores, and course quiz evaluation.
    """
    try:
        today_iso = datetime.utcnow().isoformat() + "Z"
        
        # Resolve slugs to IDs
        course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("id").eq("slug", course_id).execute())
        if not course_res.data and _is_valid_uuid(course_id):
            course_res = await asyncio.to_thread(lambda: supabase.from_("courses").select("id").eq("id", course_id).execute())
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        course_id = course_res.data[0]["id"]

        module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("slug", module_id).execute())
        if not module_res.data and _is_valid_uuid(module_id):
            module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("id", module_id).execute())
        if not module_res.data:
            raise HTTPException(status_code=404, detail="Module not found")
        module_id = module_res.data[0]["id"]

        card_res_id = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("slug", card_id).execute())
        if not card_res_id.data and _is_valid_uuid(card_id):
            card_res_id = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("card_id", card_id).execute())
        if not card_res_id.data:
            raise HTTPException(status_code=404, detail="Card not found")
        card_id = card_res_id.data[0]["card_id"]

        # Non-admins cannot save progress into a draft course
        if (await _hidden_from(course_id, user)
                or await _hidden_module_from(module_id, user)
                or await _hidden_module_from(card_res_id.data[0].get("module_id"), user)):
            raise HTTPException(status_code=404, detail="Card not found")

        # 1. Fetch card details and user scoring metrics concurrently
        card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("*").eq("card_id", card_id).single().execute())
        user_res = await asyncio.to_thread(lambda: supabase.from_("users").select("fin_stars, course_count, course_score, consistency_score, article_score, expense_score").eq("email", user.email).limit(1).execute())
        # "status" is needed so a card completed before never pays stars/bonuses again
        existing_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("id, status").match({
            "email": user.email,
            "module_id": module_id,
            "card_id": card_id,
            "progress_type": "card"
        }).limit(1).execute())
        
        card_data = card_res.data
        db_user = user_res.data[0] if user_res and user_res.data else {}
        existing_progress = existing_res.data[0] if existing_res and existing_res.data else None

        # Parse answer tag if a valid option index is provided
        options_tags = []
        if isinstance(card_data.get("options_tags"), str):
            try:
                import json
                options_tags = json.loads(card_data["options_tags"])
            except:
                pass
        elif isinstance(card_data.get("options_tags"), list):
            options_tags = card_data["options_tags"]
            
        answer_tags = options_tags[body.userIndex] if (body.userIndex is not None and body.userIndex < len(options_tags)) else None
        
        # 2. Insert or update card completion log
        payload = {
            "status": body.status,
            "user_answer": body.userAnswer,
            "answer_tags": answer_tags,
            "completion_date": today_iso if body.status == "completed" else None
        }
        
        if existing_progress:
            await asyncio.to_thread(lambda: supabase.from_("userCourses").update(payload).eq("id", existing_progress["id"]).execute())
        else:
            payload_insert = {
                "email": user.email,
                "course_id": course_id,
                "module_id": module_id,
                "card_id": card_id,
                "progress_type": "card",
                **payload
            }
            await asyncio.to_thread(lambda: supabase.from_("userCourses").insert([payload_insert]).execute())
            
        # 3. Update stars if earned (and only if first time completing)
        was_already_completed = existing_progress and existing_progress.get("status") == "completed"
        stars_earned = body.finStars
        if card_data.get("card_template") in SERVER_STARS_TEMPLATES:
            stars_earned = get_card_finstars(card_data.get("card_data") or {}, card_data["card_template"])
        if stars_earned and body.status == "completed" and not was_already_completed:
            current_stars = db_user.get("fin_stars") or 0
            current_stars += stars_earned
            await asyncio.to_thread(lambda: supabase.from_("users").update({"fin_stars": current_stars}).eq("email", user.email).execute())
            
        # 4. Fetch module details to calculate module completion progress
        all_cards_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").eq("module_id", module_id).order("order_index").execute())
        completed_cards_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id").match({
            "email": user.email,
            "module_id": module_id,
            "progress_type": "card",
            "status": "completed"
        }).execute())
        all_cards = all_cards_res.data or []
        completed_cards = completed_cards_res.data or []
        
        current_index = next((i for i, c in enumerate(all_cards) if c["card_id"] == card_id), -1)
        prev_card_id = all_cards[current_index - 1]["card_id"] if current_index > 0 else None
        next_card_id = all_cards[current_index + 1]["card_id"] if current_index < len(all_cards) - 1 else None
        
        module_progress = len(completed_cards)
        module_total_cards = len(all_cards)
        
        logs = []
        
        # 5. Award Module completion bonus
        course_count = db_user.get("course_count") or 0
        course_score = db_user.get("course_score") or 0
        consistency_score = db_user.get("consistency_score") or 0
        article_score = db_user.get("article_score") or 0
        expense_score = db_user.get("expense_score") or 0
        
        # Only award bonus if this is the first time they completed this specific card to reach 100%
        was_already_completed = existing_progress and existing_progress.get("status") == "completed"
        
        if module_progress == module_total_cards and not was_already_completed and course_count < 5:
            old_score = course_score + consistency_score + article_score + expense_score
            new_course_score = min(course_score + 20, 500)
            new_total = new_course_score + consistency_score + article_score + expense_score
            delta = new_total - old_score
            
            await asyncio.to_thread(lambda: supabase.from_("users").update({"course_score": new_course_score}).eq("email", user.email).execute())
            course_score = new_course_score  # Update reference
            
            if delta != 0:
                logs.append({
                    "email": user.email,
                    "old_score": old_score,
                    "new_score": new_total,
                    "change": delta,
                    "description": "+20 for completing module"
                })
                
        # 6. Check full Course completion & evaluate quiz score — only once the
        #    course is whole (every planned module released), so a course that
        #    grows week by week never pays its completion reward early or twice
        modules_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("*").eq("course_id", course_id).order("order_index").execute())
        modules = modules_res.data or []
        module_ids = [m["id"] for m in modules]
        course_row = await asyncio.to_thread(course_repo.get_by_id, course_id)
        course_whole = course_can_complete(course_row, modules)
        
        all_course_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id").in_("module_id", module_ids).execute())
        completed_course_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("card_id").match({
            "email": user.email,
            "course_id": course_id,
            "progress_type": "card",
            "status": "completed"
        }).execute())
        
        if course_whole and len(all_course_res.data or []) == len(completed_course_res.data or []) and not was_already_completed and course_count < 5:
            # Course completed! Fetch answers and correct keys to compute score
            answers_res = await asyncio.to_thread(lambda: supabase.from_("userCourses").select("user_answer, card_id").match({"email": user.email, "course_id": course_id, "progress_type": "card"}).execute())
            keys_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, card_data").in_("module_id", module_ids).execute())
            
            correct_map = {}
            for c in (keys_res.data or []):
                cd = c.get("card_data") or {}
                if cd.get("card_type") == "quiz":
                    correct_opt = next((opt["id"] for opt in cd.get("options", []) if opt.get("is_correct")), None)
                    if correct_opt:
                        correct_map[c["card_id"]] = correct_opt
            
            correct = 0
            total = 0
            for row in (answers_res.data or []):
                card_id_ref = row["card_id"]
                user_ans = (row.get("user_answer") or "").strip()
                if card_id_ref in correct_map:
                    total += 1
                    if user_ans == correct_map[card_id_ref]:
                        correct += 1
                        
            percent = (correct / total) * 100 if total > 0 else 100
            
            quiz_bonus = 0
            reason = ""
            if percent >= 80:
                quiz_bonus = 10
                reason = "+10 for >=80% in course quiz"
            elif percent >= 60:
                quiz_bonus = 5
                reason = "+5 for 60-79% in course quiz"
            else:
                quiz_bonus = -5
                reason = "-5 for <60% in course quiz"
                
            old_score = course_score + consistency_score + article_score + expense_score
            new_course_score = max(0, min(course_score + quiz_bonus, 500))
            new_total = new_course_score + consistency_score + article_score + expense_score
            delta = new_total - old_score
            
            await asyncio.to_thread(lambda: supabase.from_("users").update({
                "course_score": new_course_score,
                "course_count": course_count + 1
            }).eq("email", user.email).execute())
            
            if delta != 0:
                logs.append({
                    "email": user.email,
                    "old_score": old_score,
                    "new_score": new_total,
                    "change": delta,
                    "description": reason
                })
                
        # Bulk insert logs if any
        if logs:
            await asyncio.to_thread(lambda: supabase.from_("finScoreLogs").insert(logs).execute())
            
        return {
            **card_data,
            "status": "completed",
            "userAnswer": body.userAnswer,
            "prevCardId": prev_card_id,
            "nextCardId": next_card_id,
            "module_progress": module_progress,
            "module_total_cards": module_total_cards
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        with open("error_log.txt", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}"
        )


@router.post("/card/{card_slug}/updateCard")
async def update_card_by_slug(card_slug: str, body: UpdateCardRequest, user: AuthUser = Depends(get_current_user)):
    """
    Updates the completion status of a card using only its slug.
    Delegates to the main update_a_card function.
    """
    try:
        # Resolve card to get card_id and module_id
        card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("slug", card_slug).execute())
        if not card_res.data and _is_valid_uuid(card_slug):
            card_res = await asyncio.to_thread(lambda: supabase.from_("cards").select("card_id, module_id").eq("card_id", card_slug).execute())
        if not card_res.data:
            raise HTTPException(status_code=404, detail="Card not found")
        c_id = card_res.data[0]["card_id"]
        m_id = card_res.data[0]["module_id"]

        # Resolve module to get course_id
        module_res = await asyncio.to_thread(lambda: supabase.from_("modules").select("course_id").eq("id", m_id).execute())
        if not module_res.data:
            raise HTTPException(status_code=404, detail="Module not found")
        course_id = module_res.data[0]["course_id"]

        return await update_a_card(course_id, m_id, c_id, body, user)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update card by slug: {str(e)}"
        )

class AddCardRequest(BaseModel):
    module_id: str
    order_index: int
    card_type: str
    title: str  # admin-facing label, shown in the admin card list
    card_data: dict
    slug: Optional[str] = None  # defaults to one made from the title


class EditCardRequest(BaseModel):
    """Every field optional: send only what changes. The card type never changes."""
    title: Optional[str] = None
    slug: Optional[str] = None
    order_index: Optional[int] = None
    card_data: Optional[dict] = None


def _validated_card_data(card_type: str, raw: dict) -> dict:
    try:
        return validate_card_data(card_type, raw)
    except ValidationError as e:
        # e.g. "steps #1 › heading: Field required" (list positions counted from 1, like the admin form)
        problems = "; ".join(
            f"{' › '.join(f'#{p + 1}' if isinstance(p, int) else str(p) for p in err['loc']) or 'card_data'}: "
            f"{err['msg'].removeprefix('Value error, ')}"
            for err in e.errors(include_url=False, include_context=False)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid card_data for type '{card_type}': {problems}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/cards/add")
async def add_card(body: AddCardRequest, user: AuthUser = Depends(require_admin)):
    """
    Admin: adds a new card of any type to a module of a DRAFT course.
    card_data is validated against the schema registered for card_type
    before it is written to the database.
    """
    validated_data = _validated_card_data(body.card_type, body.card_data)

    await asyncio.to_thread(require_draft_module, body.module_id)
    slug = checked_slug(body.slug) if body.slug else slug_from_title(body.title)
    await asyncio.to_thread(require_free_slug, slug)

    try:
        res = await asyncio.to_thread(
            lambda: supabase.from_("cards")
            .insert([{
                "module_id": body.module_id,
                "order_index": body.order_index,
                "card_template": body.card_type,
                "title": body.title,
                "slug": slug,
                "card_data": validated_data,
            }])
            .execute()
        )
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add card: {str(e)}",
        )


@router.put("/cards/{card_id}")
async def edit_card(card_id: str, body: EditCardRequest, user: AuthUser = Depends(require_admin)):
    """
    Admin: edits a card of a DRAFT course in place. The card keeps its id,
    so any progress already recorded against it stays attached.
    """
    if not _is_valid_uuid(card_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    card = await asyncio.to_thread(course_repo.get_card, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    await asyncio.to_thread(require_draft_module, card["module_id"])

    changes: Dict[str, Any] = {}
    if body.title is not None:
        changes["title"] = body.title
    if body.order_index is not None:
        changes["order_index"] = body.order_index
    if body.slug is not None and body.slug != card.get("slug"):
        changes["slug"] = checked_slug(body.slug)
        await asyncio.to_thread(require_free_slug, changes["slug"], card_id)
    if body.card_data is not None:
        changes["card_data"] = _validated_card_data(card["card_template"], body.card_data)
    if not changes:
        return card

    try:
        res = await asyncio.to_thread(
            lambda: supabase.from_("cards").update(changes).eq("card_id", card_id).execute()
        )
        return res.data[0] if res.data else {**card, **changes}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to edit card: {str(e)}",
        )
