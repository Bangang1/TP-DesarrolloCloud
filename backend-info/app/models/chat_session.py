from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import List


class Message(Field):
    role: str       # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatSession(Document):
    contract_id: PydanticObjectId    # Referencia al contrato
    user_id: str                     # Clerk user ID
    messages: List[dict] = []       # Historial de mensajes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_sessions"
        indexes = ["contract_id", "user_id"]
