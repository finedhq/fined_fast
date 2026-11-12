# WinterArc metrics for the admin page: sign-ups, accounts, activation and
# 7-day return, broken down by source, campaign, college, referral and day.
# Every definition lives in SQL (migration 010_winterarc_metrics.sql); this
# file only fetches the rows and counts them. No emails leave this endpoint.
import asyncio
from collections import defaultdict

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends

from app.dependencies import AuthUser, require_admin
from app.integrations.supabase_client import supabase

router = APIRouter(prefix="/winterarc/admin", tags=["WinterArc"])

PAGE = 1000

# How each breakdown names a person's group, and what an empty value is called
DIMENSIONS = {
    "utm_source": ("Tagged source (UTM)", lambda p: p.get("utm_source") or "(no tag)"),
    "utm_campaign": ("Campaign (UTM)", lambda p: p.get("utm_campaign") or "(no tag)"),
    "heard_from": ("Said they heard from", lambda p: p.get("heard_from") or "(not answered)"),
    "college": ("College", lambda p: p.get("college") or "(not given)"),
    "referred": ("Came with a referral link", lambda p: "yes" if p.get("referred_by_code") else "no"),
    "signup_day": ("Sign-up day (IST)", lambda p: str(p.get("signed_up_ist_day") or "")),
}


def _counts(people: list) -> dict:
    n = len(people)
    activated = sum(1 for p in people if p.get("activated"))
    returned = sum(1 for p in people if p.get("returned_7d"))
    return {
        "signed_up": n,
        "has_account": sum(1 for p in people if p.get("has_account")),
        "activated": activated,
        "activation_rate": round(100 * activated / n, 1) if n else 0.0,
        "returned_7d": returned,
        "return_rate": round(100 * returned / activated, 1) if activated else 0.0,
    }


def summarize(people: list, days: list) -> dict:
    """Totals, one table per breakdown, top referral codes, and per-day stats."""
    breakdowns = {}
    for key, (label, group_of) in DIMENSIONS.items():
        groups = defaultdict(list)
        for p in people:
            groups[group_of(p)].append(p)
        rows = [{"group": g, **_counts(members)} for g, members in groups.items()]
        if key == "signup_day":
            rows.sort(key=lambda r: r["group"])
        else:
            rows.sort(key=lambda r: (-r["signed_up"], r["group"]))
        breakdowns[key] = {"label": label, "rows": rows}

    owner = {p.get("referral_code"): p.get("name") or "(no name)" for p in people if p.get("referral_code")}
    referred = defaultdict(list)
    for p in people:
        if p.get("referred_by_code"):
            referred[p["referred_by_code"]].append(p)
    referrers = sorted(
        ({"code": code, "name": owner.get(code, "(unknown)"), **_counts(friends)} for code, friends in referred.items()),
        key=lambda r: (-r["signed_up"], r["code"]),
    )

    return {
        "totals": _counts(people),
        "breakdowns": breakdowns,
        "referrers": referrers[:50],
        "days": sorted(days, key=lambda d: d["day_no"]),
    }


def _all_rows(view: str, columns: str) -> list:
    rows, start = [], 0
    while True:
        res = supabase.from_(view).select(columns).range(start, start + PAGE - 1).execute()
        batch = res.data or []
        rows.extend(batch)
        if len(batch) < PAGE:
            return rows
        start += PAGE


PEOPLE_COLUMNS = (
    "name, college, heard_from, referral_code, referred_by_code, utm_source, utm_campaign, "
    "signed_up_ist_day, has_account, activated, returned_7d, days_started, days_done, points"
)


@router.get("/metrics")
async def winterarc_metrics(user: AuthUser = Depends(require_admin)):
    people, days = await asyncio.gather(
        asyncio.to_thread(_all_rows, "winterarc_people", PEOPLE_COLUMNS),
        asyncio.to_thread(_all_rows, "winterarc_day_stats", "day_no, started, done, avg_points, actions_done"),
    )
    return summarize(people, days)


@router.get("/referral-contest")
async def referral_contest(user: AuthUser = Depends(require_admin)):
    """The pre-launch top-referrer contest (migration 011): referrals whose
    friend joined with the link and has a FinEd account with the same email,
    both by 30 Nov 2026 23:59 IST. Ranked by count, then who got there first.
    The winner is still checked by hand before payment."""
    rows = await asyncio.to_thread(_all_rows, "winterarc_referral_contest", "code, referrer_name, referrals, reached_at, rank")
    rows.sort(key=lambda r: (r["rank"], r["code"]))
    return {"closes_at": "2026-11-30T23:59:59+05:30", "rows": rows[:50]}
