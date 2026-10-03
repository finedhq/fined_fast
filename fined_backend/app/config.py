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


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()