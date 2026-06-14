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
        "https://www.myfined.com",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


@app.get("/",tags=["Health"])
async def root():
    return {"status": "FinEd API is running", "version": "2.0.0"}

from app.routes import api_router
app.include_router(api_router, prefix="/api")
