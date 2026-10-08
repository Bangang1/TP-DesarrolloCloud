from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "contratos_db"

    # Supabase (verificación JWT en el backend)
    supabase_jwt_secret: str = ""

    # Azure Blob Storage (SAS de lectura para n8n y borrado de PDFs)
    azure_storage_account_name: str = ""
    azure_storage_account_key: str = ""
    azure_storage_container_name: str = ""

    # n8n
    n8n_webhook_url: str = "http://n8n:5678/webhook/analizar-contrato"
    n8n_webhook_secret: str = ""

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
