# Loads the built frontend index.html so the API can inject per-page SEO tags.
#
# On the API host (Heroku) the frontend build is not on disk, so the shell is
# fetched from the frontend's static /index.html and cached in memory. That path
# is a plain static file on Vercel, so it never goes through the bot rewrite
# and can't loop back to this server.

import asyncio
import os
import re
import time
from typing import Optional

import httpx

from app.config import settings

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_FRONTEND_DIR = os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "fined_frontend"))

_TTL_SECONDS = 600
_RETRY_AFTER_FAILURE_SECONDS = 30
_FETCH_TIMEOUT_SECONDS = 3.0

_cache: dict = {"html": None, "fetched_at": 0.0, "retry_at": 0.0}
_lock = asyncio.Lock()

# Tags the injected article block replaces, so the page never carries two of each.
_REPLACED_TAGS = [
    re.compile(r"<title>.*?</title>\s*", re.I | re.S),
    re.compile(
        r"""<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>\s*""",
        re.I,
    ),
    re.compile(r"""<link\s+rel=["']canonical["'][^>]*>\s*""", re.I),
]


def _read_local() -> Optional[str]:
    candidates = [
        os.path.join(_FRONTEND_DIR, "dist", "index.html"),
        os.path.join(_FRONTEND_DIR, "index.html"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
    return None


def _remote_bases() -> list:
    bases = []
    for base in (settings.FRONTEND_URL, "https://myfined.com"):
        base = (base or "").rstrip("/")
        if base and base not in bases:
            bases.append(base)
    return bases


async def _fetch_remote() -> Optional[str]:
    async with httpx.AsyncClient(timeout=_FETCH_TIMEOUT_SECONDS, follow_redirects=False) as client:
        for base in _remote_bases():
            try:
                resp = await client.get(f"{base}/index.html")
            except Exception:
                continue
            if resp.status_code == 200 and 'id="root"' in resp.text:
                return resp.text
    return None


async def get_shell_html() -> Optional[str]:
    """Return the frontend index.html, or None if it can't be had right now."""
    local = _read_local()
    if local:
        return local

    now = time.monotonic()
    if _cache["html"] and now - _cache["fetched_at"] < _TTL_SECONDS:
        return _cache["html"]
    if not _cache["html"] and now < _cache["retry_at"]:
        return None

    async with _lock:
        now = time.monotonic()
        if _cache["html"] and now - _cache["fetched_at"] < _TTL_SECONDS:
            return _cache["html"]
        if not _cache["html"] and now < _cache["retry_at"]:
            return None

        fetched = await _fetch_remote()
        if fetched:
            _cache.update(html=fetched, fetched_at=now, retry_at=0.0)
        elif _cache["html"]:
            # Keep serving the last good copy and try again shortly.
            _cache["fetched_at"] = now - _TTL_SECONDS + _RETRY_AFTER_FAILURE_SECONDS
        else:
            _cache["retry_at"] = now + _RETRY_AFTER_FAILURE_SECONDS
        return _cache["html"]


def strip_replaced_tags(html_content: str) -> str:
    for pattern in _REPLACED_TAGS:
        html_content = pattern.sub("", html_content)
    return html_content
