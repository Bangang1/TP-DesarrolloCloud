from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "contratos_db"

    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_bucket_name: str = ""
    aws_region: str = "us-east-1"

    # n8n
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    # Clerk
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # OpenAI
    openai_api_key: str = ""

    # App
    app_env: str = "development"
    app_secret_key: str = "changeme"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
