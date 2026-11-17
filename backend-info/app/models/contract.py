from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
from enum import Enum


class ContractStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"


class Contract(Document):
    user_id: str                          # Supabase user ID
    org_id: Optional[str] = None         # Organizacion (sin uso por ahora)
    filename: str                         # Nombre original del archivo
    blob_name: str                       # Nombre del blob en Azure Storage
    status: ContractStatus = ContractStatus.PENDING
    error_message: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Settings:
        name = "contracts"
        indexes = ["user_id", "org_id", "status"]
