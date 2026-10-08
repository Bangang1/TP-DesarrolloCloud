"""
Rutas /api/contratos — Flujo Direct-to-Cloud.

El frontend sube el PDF directamente a Azure Blob Storage y luego registra
la URL aquí. Se persiste el documento en MongoDB con estado "pendiente" y se
dispara el webhook de n8n en segundo plano para el procesamiento con IA.

Todos los endpoints requieren el JWT de Supabase; el usuario se toma del
token (`sub`), nunca del body.
"""

from typing import Optional

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import verify_supabase_token
from app.models.analysis import Analysis
from app.models.chat_session import ChatSession
from app.models.contrato import Contrato
from app.services.azure_storage import (
    azure_configurado,
    blob_pertenece_al_usuario,
    eliminar_blob,
    generar_url_lectura,
)
from app.services.n8n import trigger_contract_analysis

router = APIRouter(prefix="/api/contratos", tags=["Contratos - Direct Upload"])

# Estados internos (Mongo) -> estados que espera el frontend
ESTADOS_FRONTEND = {
    "pendiente": "pending",
    "procesando": "processing",
    "completado": "completed",
    "error": "error",
}

SEVERIDAD_ORDEN = {"low": 0, "medium": 1, "high": 2}


# ─── Esquemas ─────────────────────────────────────────────────────────────────

class ContratoRequest(BaseModel):
    contrato_url: str = Field(..., min_length=1, description="URL del PDF en Azure Blob Storage")
    nombre_archivo: Optional[str] = Field(default=None, description="Nombre original del archivo")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def riesgo_maximo(analysis: Optional[Analysis]) -> Optional[str]:
    """Devuelve la severidad más alta entre los riesgos del análisis."""
    if not analysis or not analysis.risks:
        return None
    severidades = [r.get("severity", "low") for r in analysis.risks]
    return max(severidades, key=lambda s: SEVERIDAD_ORDEN.get(s, 0))


def serializar_contrato(contrato: Contrato, analysis: Optional[Analysis] = None) -> dict:
    return {
        "id": str(contrato.id),
        "filename": contrato.nombre_archivo or contrato.contrato_url.rsplit("/", 1)[-1],
        "status": ESTADOS_FRONTEND.get(contrato.estado, "pending"),
        "uploaded_at": contrato.fecha_creacion.isoformat(),
        "risk": riesgo_maximo(analysis),
    }


async def obtener_contrato_del_usuario(contrato_id: str, user_id: str) -> Contrato:
    try:
        oid = PydanticObjectId(contrato_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    contrato = await Contrato.get(oid)
    if not contrato or contrato.usuario_id != user_id:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return contrato


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/analizar", status_code=200)
async def analizar_contrato(
    body: ContratoRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_supabase_token),
):
    """
    1. Inserta un nuevo Contrato en MongoDB (estado: pendiente) para el usuario del token.
    2. Programa la notificación a n8n como tarea en segundo plano.
    3. Retorna 200 con el ID del contrato insertado (respuesta inmediata).
    """
    user_id = user["sub"]

    if not azure_configurado():
        raise HTTPException(status_code=500, detail="Azure Storage no está configurado en el backend")

    # Solo se aceptan PDFs subidos por este usuario a nuestro contenedor
    if not blob_pertenece_al_usuario(body.contrato_url, user_id):
        raise HTTPException(status_code=400, detail="La URL del contrato no es válida")

    contrato = Contrato(
        usuario_id=user_id,
        contrato_url=body.contrato_url,
        nombre_archivo=body.nombre_archivo,
    )
    await contrato.insert()

    # n8n descarga el PDF con una URL de lectura temporal (el contenedor es privado)
    url_lectura = generar_url_lectura(body.contrato_url)
    background_tasks.add_task(trigger_contract_analysis, str(contrato.id), url_lectura, user_id)

    return {
        "message": "Contrato registrado. El análisis de IA se iniciará en breve.",
        "id": str(contrato.id),
    }


@router.get("/")
async def listar_contratos(user: dict = Depends(verify_supabase_token)):
    """Lista los contratos del usuario, del más reciente al más antiguo."""
    contratos = await Contrato.find(
        Contrato.usuario_id == user["sub"]
    ).sort(-Contrato.fecha_creacion).to_list()

    ids = [c.id for c in contratos]
    analyses = await Analysis.find(In(Analysis.contract_id, ids)).to_list() if ids else []
    analysis_por_contrato = {a.contract_id: a for a in analyses}

    return [serializar_contrato(c, analysis_por_contrato.get(c.id)) for c in contratos]


@router.get("/{contrato_id}")
async def obtener_contrato(contrato_id: str, user: dict = Depends(verify_supabase_token)):
    """Devuelve el contrato junto con su análisis (si ya está completado)."""
    contrato = await obtener_contrato_del_usuario(contrato_id, user["sub"])
    analysis = await Analysis.find_one(Analysis.contract_id == contrato.id)

    data = serializar_contrato(contrato, analysis)
    data["contrato_url"] = contrato.contrato_url
    data["analysis"] = (
        {
            "summary": analysis.summary,
            "parties": analysis.parties,
            "key_dates": analysis.key_dates,
            "risks": analysis.risks,
            "clauses": analysis.clauses,
        }
        if analysis
        else None
    )
    return data


@router.delete("/{contrato_id}", status_code=204)
async def eliminar_contrato(
    contrato_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_supabase_token),
):
    """
    Elimina el contrato, sus datos asociados (análisis y sesiones de chat)
    y, en segundo plano, el PDF en Azure Blob Storage.
    """
    contrato = await obtener_contrato_del_usuario(contrato_id, user["sub"])

    await Analysis.find(Analysis.contract_id == contrato.id).delete()
    await ChatSession.find(ChatSession.contract_id == contrato.id).delete()
    await contrato.delete()

    if azure_configurado():
        background_tasks.add_task(eliminar_blob, contrato.contrato_url)
