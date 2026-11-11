# Configuration manager using pydantic-settings
from pydantic_settings import BaseSettings,SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str

    AUTH0_DOMAIN: str
    AUTH0_AUDIENCE: str
    # Transitional: the previous audience, still accepted while already-issued
    # tokens expire. Unset it (and delete the fallback in dependencies.py)
    # once the migration window closes - after 2026-10-18.
    AUTH0_LEGACY_AUDIENCE: Optional[str] = None
 



    SMTP_USER: str
    SMTP_PASSWORD: str

    REDIS_URL: str = "redis://localhost:6379"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"

    FRONTEND_URL: str = "https://fined-web.vercel.app"
    ENVIRONMENT: str = "development"
    SENTRY_DSN: str | None = None

    # WinterArc: Day 1 opens at this moment; day n opens n-1 days later.
    # Set an earlier start on the practice/staging backend to rehearse.
    WINTERARC_START: str = "2026-12-01T00:00:00+05:30"
    # The (draft) course whose modules are the 30 days, order_index = day
    WINTERARC_COURSE_SLUG: str = "winterarc"


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()