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
    allow_methods=["*"],
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
from app.routes.users import router as users_router
app.include_router(api_router, prefix="/api")
app.include_router(users_router)

# Serve Frontend Static Files & SPA fallback routing (e.g. for /about)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "fined_frontend", "dist"))

# Mount assets if they exist
if os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

import html
from app.services.page_shell import get_shell_html, strip_replaced_tags

@app.api_route("/{fallback_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
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
    file_path = os.path.realpath(os.path.join(FRONTEND_DIST_DIR, fallback_path))
    dist_root = os.path.realpath(FRONTEND_DIST_DIR)
    if (
        fallback_path
        and file_path.startswith(dist_root + os.sep)
        and os.path.isfile(file_path)
    ):
        return FileResponse(file_path)

    # The built index.html: local dist/dev copy, or fetched from the frontend host
    # when the API runs without the frontend on disk (cached in page_shell).
    shell_html = await get_shell_html()

    # Check if request is for a single article (for social crawler preview generation)
    is_article_path = fallback_path.startswith("articles/")
    lookup_failed = False
    article_missing = False
    if is_article_path:
        slug = fallback_path.split("articles/")[1].strip("/").split("?")[0]
        if slug:
            try:
                article = article_service.get_by_slug(slug)
                if article:
                    metadata = article.get("metadata") or {}
                    seo_title = article.get("seo_title") or metadata.get("seo_title") or article.get("title") or "FinEd Article"
                    title = html.escape(seo_title)
                    display_title = html.escape(article.get("title") or seo_title)
                    
                    raw_desc = (
                        article.get("meta_description")
                        or metadata.get("meta_description")
                        or article.get("description")
                        or (article.get("content", "").split("\n")[0] if article.get("content") else "A clear, practical finance explainer from FinEd.")
                    )
                    description = html.escape(raw_desc[:160].strip())
                    image_url = html.escape(article.get("image_url") or "https://myfined.com/fined_card_banner.png")
                    article_url = f"https://myfined.com/articles/{slug}"
                    tag = article.get("tag") or "Finance"
                    published_date = article.get("published_at") or article.get("created_at") or ""
                    updated_date = article.get("updated_at") or published_date

                    author_obj = article.get("authors") or {}
                    author_name = author_obj.get("name") if isinstance(author_obj, dict) else (article.get("author") or "FinEd Editorial Team")
                    author_slug = author_obj.get("slug") if isinstance(author_obj, dict) else "fined-editorial"

                    reviewer_obj = article.get("reviewer")
                    reviewed_by_json = ""
                    if reviewer_obj and isinstance(reviewer_obj, dict):
                        rev_name = html.escape(reviewer_obj.get("name") or "")
                        rev_slug = html.escape(reviewer_obj.get("slug") or "")
                        if rev_name:
                            reviewed_by_json = f""",
      "reviewedBy": {{
        "@type": "Person",
        "name": "{rev_name}",
        "url": "https://myfined.com/authors/{rev_slug}"
      }}"""

                    schema_json = f"""{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "Article",
      "headline": "{display_title}",
      "description": "{description}",
      "image": "{image_url}",
      "datePublished": "{published_date}",
      "dateModified": "{updated_date}",
      "mainEntityOfPage": "{article_url}",
      "author": {{
        "@type": "Person",
        "name": "{author_name}",
        "url": "https://myfined.com/authors/{author_slug}"
      }}{reviewed_by_json},
      "publisher": {{
        "@type": "Organization",
        "name": "FinEd",
        "url": "https://myfined.com",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://myfined.com/logo.ico"
        }}
      }}
    }},
    {{
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://myfined.com"
        }},
        {{
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": "https://myfined.com/articles"
        }},
        {{
          "@type": "ListItem",
          "position": 3,
          "name": "{tag}",
          "item": "https://myfined.com/tags/{tag.lower().replace(' ', '-')}"
        }},
        {{
          "@type": "ListItem",
          "position": 4,
          "name": "{display_title}",
          "item": "{article_url}"
        }}
      ]
    }}
  ]
}}"""

                    seo_meta_tags = f"""
  <title>{title} | FinEd</title>
  <meta name="description" content="{description}" />
  <link rel="canonical" href="{article_url}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="FinEd" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:image" content="{image_url}" />
  <meta property="og:image:alt" content="{display_title}" />
  <meta property="og:url" content="{article_url}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@FinEd" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />
  <meta name="twitter:image" content="{image_url}" />
  <meta name="twitter:image:alt" content="{display_title}" />

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">{schema_json}</script>
"""
                    if shell_html and "</head>" in shell_html:
                        # Drop the shell's generic title/description/OG tags so the page has one of each
                        page_html = strip_replaced_tags(shell_html).replace("</head>", f"{seo_meta_tags}\n</head>", 1)
                    else:
                        # No shell available: still answer with the tags rather than redirecting
                        page_html = (
                            '<!doctype html><html lang="en"><head><meta charset="UTF-8" />'
                            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
                            f'{seo_meta_tags}</head><body><div id="root"></div>'
                            f'<p><a href="{article_url}">{display_title}</a></p></body></html>'
                        )
                    return Response(content=page_html, media_type="text/html")
                article_missing = True
            except Exception:
                lookup_failed = True  # Fall back to standard index.html on any error

    # Serve index.html for SPA routes (e.g., /about, /courses, etc.)
    if shell_html:
        # Unknown article slug: keep the SPA's own "not found" page but tell crawlers it is a 404
        return Response(content=shell_html, media_type="text/html", status_code=404 if article_missing else 200)

    # No shell available. Never redirect article URLs: the frontend host sends crawlers
    # for /articles/* straight back here, which makes a redirect loop.
    if is_article_path:
        if lookup_failed:
            return Response(content="Temporarily unavailable", status_code=503, headers={"Retry-After": "60"})
        return Response(content="Not found", status_code=404, media_type="text/plain")

    # Fallback redirect to Frontend URL if the frontend shell isn't available
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/{fallback_path}")


