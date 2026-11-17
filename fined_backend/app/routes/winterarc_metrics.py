# WinterArc metrics for the admin page: sign-ups, accounts, activation and
# 7-day return, broken down by source, campaign, college, referral and day.
# Every definition lives in SQL (migration 010_winterarc_metrics.sql); this
# file only fetches the rows and counts them. No emails leave this endpoint.
import asyncio
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import AuthUser, require_admin
from app.integrations.supabase_client import supabase
from app.services import winterarc_rules as R

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
async def referral_contest(contest: Optional[str] = None, user: AuthUser = Depends(require_admin)):
    """A top-referrer contest (migration 014): 'nov' (by 30 Nov) or 'dec'
    (1-30 Dec); the one running now if not given. A friend counts when they
    joined with the link inside the contest's dates and have a FinEd account
    (same email) by its close, and has finished 3 days of the challenge
    (migration 015: Days 1-3 by 3 Dec for 'nov', any 3 by 30 Dec for 'dec'). Ranked by count, then who got there first; only
    referrers with at least 5 friends can win. Checked by hand before payment."""
    key = contest or R.contest_at(datetime.now(timezone.utc))
    if key not in dict(R.REFERRAL_CONTESTS):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "There is no such contest.")

    def load():
        res = (supabase.from_("winterarc_referral_contests")
               .select("code, referrer_name, referrals, reached_at, rank, joined").eq("contest", key).execute())
        return res.data or []

    rows = R.contest_standings(await asyncio.to_thread(load))
    return {"contest": key, "closes_at": R.contest_closes(key).isoformat(), "minimum": R.REFERRAL_AWARD_MIN,
            "friend_days": R.REFERRAL_FRIEND_DAYS, "results_on": R.contest_results_on(key), "rows": rows[:50]}
