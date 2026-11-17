from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "contratos_db"

<<<<<<< HEAD
    # Supabase
    supabase_url: str = ""

    # Azure Blob Storage
    azure_storage_account_name: str = ""
    azure_storage_account_key: str = ""
    azure_storage_container_name: str = "contratos"
=======
    # Supabase (verificación JWT: JWKS para claves asimétricas, secret para legacy HS256)
    supabase_url: str = ""
    supabase_jwt_secret: str = ""

    # Azure Blob Storage (SAS de lectura para n8n y borrado de PDFs)
    azure_storage_account_name: str = ""
    azure_storage_account_key: str = ""
    azure_storage_container_name: str = ""
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6

    # n8n
    n8n_webhook_url: str = "http://n8n:5678/webhook/analizar-contrato"
    n8n_webhook_secret: str = ""

<<<<<<< HEAD
    # Claude (chat sobre contratos)
    anthropic_api_key: str = ""
    claude_model: str = "claude-haiku-5-5"
=======
    # OpenAI
    openai_api_key: str = ""
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6

    # App
    app_env: str = "development"

    # CORS: orígenes del frontend permitidos, separados por coma
    # ej: "http://localhost:3000,https://suchus.vercel.app"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
