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

    # Mobile app push notifications (Phase 5): Firebase service account JSON, as one line.
    # Unset = no phone notifications; everything else works as before.
    FIREBASE_SERVICE_ACCOUNT: str | None = None

    # In-app account deletion (Phase 6): an Auth0 Machine-to-Machine application allowed to use the
    # Auth0 Management API with the delete:users permission. Unset = account deletion is refused.
    AUTH0_MGMT_CLIENT_ID: str | None = None
    AUTH0_MGMT_CLIENT_SECRET: str | None = None
    # The tenant's own *.auth0.com domain if AUTH0_DOMAIN is a custom domain (the Management API
    # only answers on the tenant domain). Defaults to AUTH0_DOMAIN.
    AUTH0_MGMT_DOMAIN: str | None = None


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()