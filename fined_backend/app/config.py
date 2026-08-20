# Configuration manager using pydantic-settings
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str

    AUTH0_DOMAIN: str
    AUTH0_AUDIENCE: str
 


    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

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