from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.contract import Contract
from app.models.analysis import Analysis
from app.models.chat_session import ChatSession


async def connect_db():
    """Inicializa la conexion a MongoDB con Beanie ORM."""
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[Contract, Analysis, ChatSession],
    )
    print(f"[DB] Conectado a MongoDB: {settings.mongodb_db_name}")


async def disconnect_db():
    """Cierra la conexion a MongoDB."""
    pass
