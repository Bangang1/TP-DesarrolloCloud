import hmac

from fastapi import APIRouter, HTTPException, Request
from app.models.contrato import Contrato
from app.models.analysis import Analysis
from app.core.config import settings
from beanie import PydanticObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def _validar_secret(payload: dict) -> None:
    """Rechaza el request si el secret no coincide o si no hay secret configurado."""
    esperado = settings.n8n_webhook_secret
    recibido = str(payload.get("secret") or "")
    if not esperado or not hmac.compare_digest(recibido.encode(), esperado.encode()):
        raise HTTPException(status_code=403, detail="Secret invalido")


async def _obtener_contrato(contract_id) -> Contrato:
    try:
        oid = PydanticObjectId(contract_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    contrato = await Contrato.get(oid)
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return contrato


@router.post("/n8n/analysis-complete")
async def n8n_analysis_complete(request: Request):
    """
    Webhook que recibe n8n cuando termina de analizar un contrato.
    n8n envia el resultado del analisis y FastAPI lo guarda en MongoDB.

    Payload esperado de n8n:
    {
        "secret": "...",
        "contract_id": "...",
        "user_id": "...",
        "status": "completado" | "error",
        "summary": "...",
        "parties": [...],
        "key_dates": [...],
        "risks": [...],
        "clauses": [...],
        "raw_text": "..."
    }
    """
    payload = await request.json()

    _validar_secret(payload)

    status = payload.get("status", "error")
    contrato = await _obtener_contrato(payload.get("contract_id"))

    if status == "error":
        contrato.estado = "error"
        await contrato.save()
        return {"ok": True, "status": "error registrado"}

    # Guardar analisis en MongoDB
    analysis = Analysis(
        contract_id=contrato.id,
        user_id=contrato.usuario_id,
        summary=payload.get("summary", ""),
        parties=payload.get("parties", []),
        key_dates=payload.get("key_dates", []),
        risks=payload.get("risks", []),
        clauses=payload.get("clauses", []),
        raw_text=payload.get("raw_text", ""),
    )
    await analysis.insert()

    # Actualizar estado del contrato y guardar el resumen en analisis_ia
    contrato.estado = "completado"
    contrato.analisis_ia = payload.get("summary", "")
    await contrato.save()

    return {"ok": True, "analysis_id": str(analysis.id)}


@router.post("/n8n/analysis-progress")
async def n8n_analysis_progress(request: Request):
    """
    Webhook opcional para actualizar el progreso del analisis.
    Permite mostrar al usuario en que etapa esta el procesamiento.
    """
    payload = await request.json()

    _validar_secret(payload)

    contrato = await _obtener_contrato(payload.get("contract_id"))
    contrato.estado = "procesando"
    await contrato.save()

    return {"ok": True}
