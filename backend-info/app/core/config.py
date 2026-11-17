from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "contratos_db"

    # Supabase
    supabase_url: str = ""

    # Azure Blob Storage
    azure_storage_account_name: str = ""
    azure_storage_account_key: str = ""
    azure_storage_container_name: str = "contratos"

    # n8n
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    # Claude (chat sobre contratos)
    anthropic_api_key: str = ""
    claude_model: str = "claude-haiku-5-5"

    # App
    app_env: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
