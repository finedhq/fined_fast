# Admin-only list of content sources: the links behind the facts and numbers
# in course content (migration 004_content_sources.sql). Learners never see
# these. Unlike cards, sources stay editable after a course is published, so
# "checked on" dates can be kept up to date.
import asyncio
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.dependencies import AuthUser, require_admin
from app.integrations.supabase_client import supabase

router = APIRouter(prefix="/sources", tags=["Content sources"])


def _check_url(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    value = value.strip()
    if not value.lower().startswith(("http://", "https://")):
        raise ValueError("must start with http:// or https://")
    return value


class SourceIn(BaseModel):
    module_id: Optional[str] = None
    label: str = Field(min_length=1, max_length=300)
    url: str = Field(min_length=8, max_length=2000)
    backs: Optional[str] = Field(default=None, max_length=500)
    checked_on: Optional[date] = None

    _url = field_validator("url")(_check_url)


class SourceEdit(BaseModel):
    """Every field optional: send only what changes."""
    module_id: Optional[str] = None
    label: Optional[str] = Field(default=None, min_length=1, max_length=300)
    url: Optional[str] = Field(default=None, min_length=8, max_length=2000)
    backs: Optional[str] = Field(default=None, max_length=500)
    checked_on: Optional[date] = None

    _url = field_validator("url")(_check_url)


def _row(values: dict) -> dict:
    out = dict(values)
    if isinstance(out.get("checked_on"), date):
        out["checked_on"] = out["checked_on"].isoformat()
    return out


async def _require_module(module_id: Optional[str]):
    if not module_id:
        return
    res = await asyncio.to_thread(lambda: supabase.from_("modules").select("id").eq("id", module_id).execute())
    if not res.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="module_id does not match any module")


@router.get("")
async def list_sources(module_id: Optional[str] = None, user: AuthUser = Depends(require_admin)):
    """All sources (or one module's), with the module and course titles, grouped in course order."""
    def run():
        q = supabase.from_("content_sources").select("*")
        if module_id:
            q = q.eq("module_id", module_id)
        rows = q.execute().data or []
        module_ids = sorted({r["module_id"] for r in rows if r.get("module_id")})
        modules = supabase.from_("modules").select("id, title, order_index, course_id").in_("id", module_ids).execute().data if module_ids else []
        course_ids = sorted({m["course_id"] for m in modules if m.get("course_id")})
        courses = supabase.from_("courses").select("id, title").in_("id", course_ids).execute().data if course_ids else []
        return rows, {m["id"]: m for m in modules}, {c["id"]: c for c in courses}

    try:
        rows, modules, courses = await asyncio.to_thread(run)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load sources: {e}")

    out = []
    for r in rows:
        m = modules.get(r.get("module_id")) or {}
        c = courses.get(m.get("course_id")) or {}
        out.append({**r, "module_title": m.get("title"), "module_order": m.get("order_index"), "course_title": c.get("title")})
    out.sort(key=lambda r: (r["course_title"] is None, r["course_title"] or "", r["module_order"] or 0,
                            r["module_title"] or "", (r.get("label") or "").lower()))
    return out


@router.post("")
async def add_source(body: SourceIn, user: AuthUser = Depends(require_admin)):
    await _require_module(body.module_id)
    row = _row(body.model_dump())
    res = await asyncio.to_thread(lambda: supabase.from_("content_sources").insert([row]).execute())
    return res.data[0] if res.data else row


@router.put("/{source_id}")
async def edit_source(source_id: str, body: SourceEdit, user: AuthUser = Depends(require_admin)):
    changes = _row(body.model_dump(exclude_unset=True))
    if ("label" in changes and changes["label"] is None) or ("url" in changes and changes["url"] is None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="label and url can't be empty")
    if changes.get("module_id"):
        await _require_module(changes["module_id"])
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to change")
    changes["updated_at"] = datetime.utcnow().isoformat() + "Z"
    res = await asyncio.to_thread(lambda: supabase.from_("content_sources").update(changes).eq("id", source_id).execute())
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return res.data[0]


@router.delete("/{source_id}")
async def delete_source(source_id: str, user: AuthUser = Depends(require_admin)):
    res = await asyncio.to_thread(lambda: supabase.from_("content_sources").delete().eq("id", source_id).execute())
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return {"deleted": source_id}
