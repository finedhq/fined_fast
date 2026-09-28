# Rules for changing course content from the admin.
#
#  - Cards can be added, edited or deleted only while nobody can learn from them:
#    in a DRAFT course, or in a module that is not released yet (a draft module
#    of a live course — plan §0.2, weekly releases). Released modules of live
#    courses are read-only here (edit them directly in Supabase if you ever
#    truly must), so learner progress counts can't be broken by accident.
#  - A module can be added to a draft course, or to a PUBLISHED course as a
#    draft (hidden) module that an admin releases later. Archived: read-only.
#  - Card slugs are looked up site-wide, so every card slug must be unique.
import re

from fastapi import HTTPException, status

from app.integrations.supabase_client import supabase
from app.repositories.course_repo import course_repo
from app.services.course_visibility import course_status, is_released

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slug_from_title(title: str) -> str:
    """Same rule the admin has always used to turn a title into a slug."""
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug


def require_draft_course(course_id: str) -> dict:
    """Return the course if it is a draft; otherwise raise 404/409."""
    course = course_repo.get_by_id(course_id) if course_id else None
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    current = course_status(course)
    if current != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This course is {current}. Modules and cards can only be changed while a course is a draft.",
        )
    return course


def require_draft_module(module_id: str) -> dict:
    """Return the module if its content may change — its course is a draft, or
    the module itself is not released yet; otherwise raise 404/409."""
    module = course_repo.get_module_by_id(module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if not is_released(module):
        course = course_repo.get_by_id(module.get("course_id"))
        if course and course_status(course) != "archived":
            return module
    require_draft_course(module.get("course_id"))
    return module


def new_module_status(course_id: str, requested: str | None) -> str | None:
    """
    The status a new module gets. Draft course: whatever was asked (default:
    no status = published, as before — the course itself is hidden). Published
    course: always 'draft', so nothing appears to learners until it's released.
    Archived course: refused.
    """
    course = course_repo.get_by_id(course_id) if course_id else None
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    current = course_status(course)
    if current == "draft":
        return requested
    if current == "published":
        return "draft"
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="This course is archived. Modules can only be added to draft or published courses.",
    )


def require_free_slug(slug: str, exclude_card_id: str | None = None) -> None:
    if not slug:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Card slug cannot be empty")
    res = supabase.from_("cards").select("card_id").eq("slug", slug).execute()
    if any(row.get("card_id") != exclude_card_id for row in (res.data or [])):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A card with the slug '{slug}' already exists. Choose a different title or slug.",
        )


def require_free_module_slug(slug: str) -> None:
    if not slug:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Module slug cannot be empty")
    res = supabase.from_("modules").select("id").eq("slug", slug).execute()
    if res.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A module with the slug '{slug}' already exists (possibly in another course). Choose a different slug, e.g. 'v2-{slug}'.",
        )


def checked_slug(slug: str) -> str:
    if not SLUG_PATTERN.match(slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug may only use lowercase letters, digits and single hyphens (e.g. v2-m1-the-slow-leak)",
        )
    return slug
