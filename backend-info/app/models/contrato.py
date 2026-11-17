"""
Modelo Contrato — Flujo Direct-to-Cloud.

Almacena la referencia a un PDF subido directamente a Azure Blob Storage
y rastrea el estado de su análisis asíncrono con IA (vía n8n).
"""

from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional


class Contrato(Document):
    usuario_id: str = Field(..., description="ID del usuario en Supabase")
    contrato_url: str = Field(..., description="URL del PDF en Azure Blob Storage")
    nombre_archivo: Optional[str] = Field(default=None, description="Nombre original del archivo subido")
    estado: str = Field(default="pendiente", description="pendiente | procesando | completado | error")
    analisis_ia: Optional[str] = Field(default=None, description="Resultado del análisis de IA")
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "contratos"
        indexes = ["usuario_id", "estado"]
