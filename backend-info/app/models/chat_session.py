from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import List


class Message(BaseModel):
    role: str       # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatSession(Document):
    contract_id: PydanticObjectId    # Referencia al contrato
    user_id: str                     # Supabase user ID
    messages: List[dict] = []       # Historial de mensajes
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "chat_sessions"
        indexes = ["contract_id", "user_id"]
