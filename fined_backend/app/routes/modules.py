# HTTP endpoints for course modules
from fastapi import APIRouter, HTTPException, status, Depends
from app.dependencies import get_current_user, require_admin, AuthUser
from pydantic import BaseModel
from typing import Optional
from app.services.course_service import course_service

router = APIRouter(prefix="/modules", tags=["Modules"])

class AddModuleRequest(BaseModel):
    title: str
    description: str
    order_index: int
    slug: Optional[str] = None  # defaults to one made from the title
    # "draft" = not released yet. Modules added to a live course are always drafts.
    status: Optional[str] = None


class ModuleStatusRequest(BaseModel):
    status: str  # "published" (release to learners) or "draft" (hide again)

@router.get("/course/{course_id}")
async def get_modules_by_course(course_id: str, user: AuthUser = Depends(get_current_user)):
    """Get all modules for a specific course"""
    try:
        from app.repositories.course_repo import course_repo
        from app.services.course_visibility import can_view_course, visible_modules
        course = course_repo.get_by_id(course_id)
        if course and not can_view_course(course, user):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Modules not found"
            )
        modules = visible_modules(course_repo.get_modules(course_id), user)
        if not modules:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Modules not found"
            )
        return modules
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch modules: {str(e)}"
        )

@router.post("/add/{course_id}", status_code=status.HTTP_201_CREATED)
async def add_module(course_id: str, body: AddModuleRequest, user: AuthUser = Depends(require_admin)):
    """Add a new module to a course: any module in a draft course, or a draft
    (hidden until released) module in a live course. Slug must be unique site-wide."""
    if not body.title or not body.description or body.order_index is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields"
        )
    from app.services.course_authoring import (
        checked_slug, new_module_status, require_free_module_slug, slug_from_title,
    )
    from app.services.course_visibility import MODULE_STATUSES
    if body.status is not None and body.status not in MODULE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"status must be one of {', '.join(MODULE_STATUSES)}")
    module_status_value = new_module_status(course_id, body.status)
    slug = checked_slug(body.slug) if body.slug else slug_from_title(body.title)
    require_free_module_slug(slug)
    try:
        return course_service.add_module(
            course_id=course_id,
            title=body.title,
            description=body.description,
            order_index=body.order_index,
            slug=slug,
            status=module_status_value,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add module: {str(e)}"
        )

@router.put("/{id}/status")
async def set_module_status(id: str, body: ModuleStatusRequest, user: AuthUser = Depends(require_admin)):
    """
    Admin: release a module to learners ("published") or hide it again
    ("draft"). Only the module's visibility changes — its content, id and any
    learner progress stay as they are.
    """
    from datetime import datetime
    from app.repositories.course_repo import course_repo
    from app.services.course_visibility import MODULE_STATUSES
    if body.status not in MODULE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"status must be one of {', '.join(MODULE_STATUSES)}")
    module = course_repo.get_module_by_id(id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if body.status == "published":
        cards = course_repo.get_cards(id)
        if not cards:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This module has no cards yet — add them before releasing it.")
    published_at = datetime.utcnow().isoformat() + "Z" if body.status == "published" else None
    try:
        return course_repo.set_module_status(id, body.status, published_at) or {**module, "status": body.status}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change module status (has migration 005 run?): {str(e)}",
        )


@router.delete("/{id}")
async def delete_module(id: str, user: AuthUser = Depends(require_admin)):
    """Delete a module (draft courses, or a module not released yet)"""
    try:
        from app.services.course_authoring import require_draft_module
        require_draft_module(id)
        course_service.delete_module(id)
        return {"message": "Module deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting module: {str(e)}"
        )
