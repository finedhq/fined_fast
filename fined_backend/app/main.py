# FastAPI main application entrypoint

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded



from app.config import settings

limiter=Limiter(key_func=get_remote_address,default_limits=["100/minute"])


app=FastAPI(
    title="FinEd API",
    description="FinEd Financial Education Platform — FastAPI Backend",
    version="2.0.0",
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
        
    # Serve index.html for SPA routes (e.g., /about, /courses, etc.)
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    # Fallback redirect to Frontend URL if dist is not built or available
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/{fallback_path}")

