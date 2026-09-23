from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional, List


class KeyDate(Field):
    type: str       # ej: "vencimiento", "inicio", "renovacion"
    date: str       # ej: "2025-06-01"
    description: Optional[str] = None


class Risk(Field):
    clause: str
    description: str
    severity: str = "medium"   # low | medium | high


class Analysis(Document):
    contract_id: PydanticObjectId            # Referencia al contrato
    user_id: str                             # Clerk user ID
    summary: str                             # Resumen ejecutivo del contrato
    parties: List[str] = []                 # Partes involucradas
    key_dates: List[dict] = []              # Fechas clave
    risks: List[dict] = []                  # Riesgos identificados
    clauses: List[dict] = []               # Clausulas relevantes
    raw_text: str = ""                      # Texto completo extraido del PDF
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "analyses"
        indexes = ["contract_id", "user_id"]
