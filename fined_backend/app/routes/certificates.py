# HTTP endpoints for course completion certificates.
#
# A certificate is issued (stored with a permanent public code) the first time a
# learner who has finished the whole course confirms the name to print on it.
# Anyone can check a code at /api/certificates/verify/{code}; the page
# myfined.com/certificate/{code} shows the result.
import asyncio
import re
import secrets
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies import get_current_user, AuthUser
from app.integrations.supabase_client import supabase
from app.repositories.course_repo import course_repo
from app.services.course_test import test_score
from app.services.course_visibility import can_view_course, course_can_complete, is_released

router = APIRouter(prefix="/certificates", tags=["Certificates"])

# Crockford-style alphabet: no 0/O, 1/I/L, so a code read off paper types back correctly
_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
_CODE_RE = re.compile(r"^FINED-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$")
NAME_MIN, NAME_MAX = 2, 60
MAX_NAME_CHANGES = 3

PUBLIC_FIELDS = ("code", "recipient_name", "course_title", "modules_count", "completed_at", "issued_at")


FINISH_EVERY_MODULE = "Finish every module in this course to get its certificate."


class ClaimRequest(BaseModel):
    name: str


def new_code() -> str:
    pick = lambda: "".join(secrets.choice(_CODE_ALPHABET) for _ in range(4))
    return f"FINED-{pick()}-{pick()}"


def normalise_code(code: str) -> str:
    return (code or "").strip().upper()


def clean_name(raw: str) -> str:
    """The name as it will be printed, or a 400 explaining what's wrong."""
    name = re.sub(r"\s+", " ", (raw or "")).strip()
    if len(name) < NAME_MIN or len(name) > NAME_MAX:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Name must be {NAME_MIN}–{NAME_MAX} characters.")
    if "@" in name or re.search(r"https?:|www\.|\.com\b", name, re.I):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use your name, not an email address or link.")
    if not re.search(r"[^\W\d_]", name):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Name must contain letters.")
    if re.search(r"[<>{}\[\]\\|^~`$%*=+#]", name):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Name can't contain symbols.")
    return name


def suggested_name(user: AuthUser) -> str:
    """Best guess for the name field (the sign-in token's name); blank when it
    looks like an email. The users table has no name column."""
    candidate = (user.name or "").strip()
    if "@" in candidate or len(candidate) < NAME_MIN:
        return ""
    return re.sub(r"\s+", " ", candidate)[:NAME_MAX]


def _public(cert: dict) -> dict:
    return {k: cert.get(k) for k in PUBLIC_FIELDS}


def _owner_view(cert: dict, course: dict) -> dict:
    return {
        **_public(cert),
        "course_slug": course.get("slug"),
        "name_changes_left": max(0, MAX_NAME_CHANGES - (cert.get("name_changes") or 0)),
    }


def _course_by_slug(slug: str) -> Optional[dict]:
    course = course_repo.get_by_slug(slug)
    if not course:
        try:
            uuid.UUID(slug)
            course = course_repo.get_by_id(slug)
        except (ValueError, TypeError):
            pass
    return course


def completion_state(course: dict, email: str) -> dict:
    """{eligible, completed_at, modules_count, test, reason} for this learner and course.
    Eligible = the course is whole (nothing left to release), every card in it
    is completed — the same rule as the course completion reward — and, when
    the course has a test (a module whose completion card sets `pass_mark`),
    at least that many of the test's questions are right."""
    modules = course_repo.get_modules(course["id"])
    released = [m for m in modules if is_released(m)]
    module_ids = [m["id"] for m in released]
    if not module_ids or not course_can_complete(course, modules):
        return {"eligible": False, "completed_at": None, "modules_count": len(released), "test": None, "reason": FINISH_EVERY_MODULE}

    cards = supabase.from_("cards").select("card_id, module_id, card_template, card_data").in_("module_id", module_ids).execute().data or []
    done = supabase.from_("userCourses").select("card_id, completion_date, user_answer").match({
        "email": email, "course_id": course["id"], "progress_type": "card", "status": "completed",
    }).execute().data or []
    done_dates = {r["card_id"]: r.get("completion_date") for r in done}
    card_ids = {c["card_id"] for c in cards}
    # every released module must have cards, and every card must be done
    modules_with_cards = {c["module_id"] for c in cards}
    finished = bool(card_ids) and modules_with_cards == set(module_ids) and card_ids <= done_dates.keys()
    # the course test, if there is one (the last test module counts)
    answers = {r["card_id"]: r.get("user_answer") for r in done}
    test = None
    for m in released:
        score = test_score([c for c in cards if c["module_id"] == m["id"]], answers)
        if score:
            test = {**score, "module_slug": m.get("slug"), "module_title": m.get("title")}
    eligible = finished and (test is None or test["passed"])
    reason = None
    if not finished:
        reason = FINISH_EVERY_MODULE
    elif not eligible:
        reason = (f"Get at least {test['pass_mark']} of {test['total']} questions right in "
                  f"\"{test['module_title']}\" to unlock your certificate. You got {test['right']}. You can retake the test.")
    dates = [d for cid, d in done_dates.items() if cid in card_ids and d]
    return {
        "eligible": eligible,
        "completed_at": max(dates) if (eligible and dates) else None,
        "modules_count": len(released),
        "test": test,
        "reason": reason,
    }


def _existing(email: str, course_id: str) -> Optional[dict]:
    res = supabase.from_("certificates").select("*").match({"email": email, "course_id": course_id}).limit(1).execute()
    return res.data[0] if res.data else None


@router.get("/course/{course_slug}")
async def my_certificate_for_course(course_slug: str, user: AuthUser = Depends(get_current_user)):
    """The signed-in learner's certificate for a course, or whether they can claim one."""
    course = await asyncio.to_thread(_course_by_slug, course_slug)
    if not course or not can_view_course(course, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    cert = await asyncio.to_thread(_existing, user.email, course["id"])
    if cert and not cert.get("revoked"):
        return {"eligible": True, "certificate": _owner_view(cert, course)}

    state = await asyncio.to_thread(completion_state, course, user.email)
    return {
        "eligible": state["eligible"],
        "reason": state["reason"],
        "test": state["test"],
        "certificate": None,
        "suggested_name": suggested_name(user),
        "course_title": course.get("title"),
        "modules_count": state["modules_count"],
        "completed_at": state["completed_at"],
    }


@router.post("/course/{course_slug}")
async def claim_certificate(course_slug: str, body: ClaimRequest, user: AuthUser = Depends(get_current_user)):
    """Issue the certificate with the confirmed name, or change the name on an
    issued one (a few times at most; the code never changes)."""
    name = clean_name(body.name)
    course = await asyncio.to_thread(_course_by_slug, course_slug)
    if not course or not can_view_course(course, user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")

    cert = await asyncio.to_thread(_existing, user.email, course["id"])
    if cert:
        if cert.get("revoked"):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This certificate is no longer valid.")
        if name == cert.get("recipient_name"):
            return {"certificate": _owner_view(cert, course)}
        if (cert.get("name_changes") or 0) >= MAX_NAME_CHANGES:
            raise HTTPException(status.HTTP_409_CONFLICT, "The name on this certificate can't be changed again. Contact us if it's wrong.")
        changes = {"recipient_name": name, "name_changes": (cert.get("name_changes") or 0) + 1}
        res = await asyncio.to_thread(lambda: supabase.from_("certificates").update(changes).eq("id", cert["id"]).execute())
        return {"certificate": _owner_view(res.data[0] if res.data else {**cert, **changes}, course)}

    state = await asyncio.to_thread(completion_state, course, user.email)
    if not state["eligible"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, state["reason"] or FINISH_EVERY_MODULE)

    now = datetime.utcnow().isoformat() + "Z"
    row = {
        "email": user.email,
        "course_id": course["id"],
        "recipient_name": name,
        "course_title": course.get("title") or "",
        "modules_count": state["modules_count"],
        "completed_at": state["completed_at"] or now,
        "issued_at": now,
        "name_changes": 0,
    }
    last_error = None
    for _ in range(5):  # a clash on the random code is astronomically rare, but retry anyway
        try:
            res = await asyncio.to_thread(lambda: supabase.from_("certificates").insert([{**row, "code": new_code()}]).execute())
            return {"certificate": _owner_view(res.data[0], course)}
        except Exception as e:  # unique violation: code clash, or a double click won the race
            last_error = e
            raced = await asyncio.to_thread(_existing, user.email, course["id"])
            if raced:
                return {"certificate": _owner_view(raced, course)}
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Could not issue certificate: {last_error}")


@router.get("/mine")
async def my_certificates(user: AuthUser = Depends(get_current_user)):
    """Every certificate the signed-in learner holds, newest first."""
    rows = await asyncio.to_thread(
        lambda: supabase.from_("certificates").select("*").eq("email", user.email).order("issued_at", desc=True).execute().data or []
    )
    out = []
    for cert in rows:
        if cert.get("revoked"):
            continue
        course = await asyncio.to_thread(course_repo.get_by_id, cert["course_id"]) or {}
        out.append(_owner_view(cert, course))
    return out


def find_public(code: str) -> Optional[dict]:
    """The public facts of a valid certificate, or None."""
    code = normalise_code(code)
    if not _CODE_RE.match(code):
        return None
    res = supabase.from_("certificates").select("*").eq("code", code).limit(1).execute()
    cert = res.data[0] if res.data else None
    if not cert or cert.get("revoked"):
        return None
    return _public(cert)


@router.get("/verify/{code}")
async def verify_certificate(code: str):
    """Public: check a certificate ID. No email or other private data is returned."""
    cert = await asyncio.to_thread(find_public, code)
    if not cert:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No valid certificate has this ID.")
    return cert
