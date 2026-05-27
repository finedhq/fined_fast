# Configuration manager using pydantic-settings
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str

    # AUTH0_DOMAIN: str
    # AUTH0_AUDIENCE: str
    AUTH0_DOMAIN: str = "placeholder.auth0.com"
    AUTH0_AUDIENCE: str = "https://api.myfined.com"
 


    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    SMTP_USER: str
    SMTP_PASSWORD: str

    REDIS_URL: str = "redis://localhost:6379"

    FRONTEND_URL: str = "https://fined-web.vercel.app"
    ENVIRONMENT: str = "development"


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()