# FastAPI main application entrypoint

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import asyncio
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.services.scheduled_publisher import publish_scheduled_articles
import sentry_sdk

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

async def run_scheduler():
    while True:
        await asyncio.to_thread(publish_scheduled_articles)
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background scheduler
    scheduler_task = asyncio.create_task(run_scheduler())
    yield
    # Shutdown: Cancel the scheduler
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass

limiter=Limiter(key_func=get_remote_address,default_limits=["100/minute"])


app=FastAPI(
    title="FinEd API",
    description="FinEd Financial Education Platform — FastAPI Backend",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)


#rate limiting
app.state.limiter=limiter
app.add_exception_handler(RateLimitExceeded,_rate_limit_exceeded_handler)

#compression

app.add_middleware(GZipMiddleware,minimum_size=500)

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://fined-web.vercel.app",
        "https://www.myfined.com"
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import os

@app.get("/", tags=["Health"])
async def root():
    return {"status": "FinEd API is running", "version": "2.0.0"}

from fastapi.responses import Response
from app.services.article_service import article_service  # adjust import to match actual service module

@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap():
    xml = article_service.build_sitemap_xml()
    return Response(content=xml, media_type="application/xml")

from app.routes import api_router
app.include_router(api_router, prefix="/api")

# Serve Frontend Static Files & SPA fallback routing (e.g. for /about)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "fined_frontend", "dist"))

# Mount assets if they exist
if os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

import html

@app.get("/{fallback_path:path}", include_in_schema=False)
async def spa_fallback(fallback_path: str):
    # Do not intercept API or docs routes
    if (
        fallback_path.startswith("api") 
        or fallback_path.startswith("docs") 
        or fallback_path.startswith("openapi.json")
        or fallback_path.startswith("redoc")
    ):
        return {"detail": "Not Found"}
        
    # If a specific static file is requested (like favicon.svg, logo.ico, etc.)
    file_path = os.path.join(FRONTEND_DIST_DIR, fallback_path)
    if fallback_path and os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Locate index.html (dist or root for local dev)
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if not os.path.exists(index_path):
        dev_index = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "fined_frontend", "index.html"))
        if os.path.exists(dev_index):
            index_path = dev_index

    # Check if request is for a single article (for social crawler preview generation)
    if fallback_path.startswith("articles/") and os.path.exists(index_path):
        slug = fallback_path.split("articles/")[1].strip("/").split("?")[0]
        if slug:
            try:
                article = article_service.get_by_slug(slug)
                if article:
                    with open(index_path, "r", encoding="utf-8") as f:
                        html_content = f.read()

                    title = html.escape(article.get("title") or "FinEd Article")
                    raw_desc = article.get("description") or (article.get("content", "").split("\n")[0] if article.get("content") else "A clear, practical finance explainer from FinEd.")
                    description = html.escape(raw_desc[:250])
                    image_url = html.escape(article.get("image_url") or "https://www.myfined.com/assets/images/fined_card_banner.png")
                    article_url = f"{settings.FRONTEND_URL}/articles/{slug}"

                    og_tags = f"""
  <title>{title} | FinEd</title>
  <meta name="description" content="{description}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="FinEd" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:image" content="{image_url}" />
  <meta property="og:url" content="{article_url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="{image_url}" />
"""
                    if "</head>" in html_content:
                        html_content = html_content.replace("</head>", f"{og_tags}\n</head>", 1)
                    return Response(content=html_content, media_type="text/html")
            except Exception:
                pass  # Fall back to standard index.html on any error
        
    # Serve index.html for SPA routes (e.g., /about, /courses, etc.)
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    # Fallback redirect to Frontend URL if dist is not built or available
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/{fallback_path}")


