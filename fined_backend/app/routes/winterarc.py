# WinterArc challenge: public waitlist sign-up (landing page, live 6 Nov 2026).
# Needs migration 008_winterarc_waitlist.sql.
import re
import secrets
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.integrations.supabase_client import supabase

router = APIRouter(prefix="/winterarc", tags=["WinterArc"])

TABLE = "winterarc_waitlist"
# Bump when the consent wording on the landing page changes
CONSENT_VERSION = "rules-2026-11-07"
# No 0/O/1/I/L, so codes survive being read aloud or typed from a poster
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
CODE_LENGTH = 6
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HEARD_FROM = {
    "college", "friend", "instagram", "linkedin", "whatsapp",
    "youtube", "search", "fined_site", "other",
}


class WaitlistRequest(BaseModel):
    email: str = Field(max_length=254)
    name: Optional[str] = Field(default=None, max_length=100)
    college: Optional[str] = Field(default=None, max_length=150)
    heard_from: Optional[str] = Field(default=None, max_length=40)
    age_confirmed: bool = False
    consent: bool = False
    # First-touch source, captured by the browser on the first visit
    ref: Optional[str] = Field(default=None, max_length=20)
    utm_source: Optional[str] = Field(default=None, max_length=100)
    utm_medium: Optional[str] = Field(default=None, max_length=100)
    utm_campaign: Optional[str] = Field(default=None, max_length=100)
    utm_content: Optional[str] = Field(default=None, max_length=100)
    utm_term: Optional[str] = Field(default=None, max_length=100)
    landing_path: Optional[str] = Field(default=None, max_length=300)
    first_referrer: Optional[str] = Field(default=None, max_length=300)
    first_seen_at: Optional[str] = Field(default=None, max_length=40)


def _clean(value: Optional[str]) -> Optional[str]:
    value = (value or "").strip()
    return value or None


def normalize_code(code: Optional[str]) -> Optional[str]:
    code = re.sub(r"[^A-Za-z0-9]", "", code or "").upper()
    return code or None


def canonical_email(email: str) -> str:
    """The inbox an email really reaches, so variants count as one person:
    lower case, anything after "+" dropped, and Gmail's dots dropped.
    Same rule as migration 012."""
    email = (email or "").strip().lower()
    local, _, domain = email.partition("@")
    local = local.split("+", 1)[0]
    if domain in ("gmail.com", "googlemail.com"):
        return local.replace(".", "") + "@gmail.com"
    return f"{local}@{domain}"


def new_code() -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


def _find_by_email(email: str):
    """This person's row: the same email, or another spelling of the same inbox."""
    res = supabase.from_(TABLE).select("referral_code").eq("email_canonical", canonical_email(email)).limit(1).execute()
    if res and res.data:
        return res.data[0]
    res = supabase.from_(TABLE).select("referral_code").ilike("email", email).limit(1).execute()
    return res.data[0] if res and res.data else None


def _code_exists(code: str) -> bool:
    res = supabase.from_(TABLE).select("id").eq("referral_code", code).limit(1).execute()
    return bool(res and res.data)


@router.post("/waitlist")
async def join_waitlist(body: WaitlistRequest):
    email = (body.email or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please enter a valid email address.")
    if not body.age_confirmed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "WinterArc is open to residents of India aged 18 or over.")
    if not body.consent:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please agree to the WinterArc rules and the privacy policy to join.")

    # Already on the list: keep the first-touch source, just return their code
    existing = _find_by_email(email)
    if existing:
        return {"referral_code": existing["referral_code"], "already_joined": True}

    heard = _clean(body.heard_from)
    if heard and heard not in HEARD_FROM:
        heard = "other"

    ref = normalize_code(body.ref)
    if ref and not _code_exists(ref):
        ref = None  # unknown codes are not stored as referrals

    row = {
        "email": email,
        "email_canonical": canonical_email(email),
        "name": _clean(body.name),
        "college": _clean(body.college),
        "heard_from": heard,
        "age_confirmed": True,
        "consent_version": CONSENT_VERSION,
        "referred_by_code": ref,
        "utm_source": _clean(body.utm_source),
        "utm_medium": _clean(body.utm_medium),
        "utm_campaign": _clean(body.utm_campaign),
        "utm_content": _clean(body.utm_content),
        "utm_term": _clean(body.utm_term),
        "landing_path": _clean(body.landing_path),
        "first_referrer": _clean(body.first_referrer),
        "first_seen_at": _clean(body.first_seen_at),
    }

    # A clash on the code (or the same email sent twice at once) is retried
    for _ in range(5):
        row["referral_code"] = new_code()
        try:
            supabase.from_(TABLE).insert([row]).execute()
            return {"referral_code": row["referral_code"], "already_joined": False}
        except Exception as exc:  # unique index hit
            again = _find_by_email(email)
            if again:
                return {"referral_code": again["referral_code"], "already_joined": True}
            last_error = exc
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Could not join the waitlist: {last_error}")
