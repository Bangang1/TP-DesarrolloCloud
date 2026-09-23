from fastapi import APIRouter, HTTPException, Request
from app.models.contract import Contract, ContractStatus
from app.models.analysis import Analysis
from app.core.config import settings
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


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
        "status": "completed" | "error",
        "summary": "...",
        "parties": [...],
        "key_dates": [...],
        "risks": [...],
        "clauses": [...],
        "raw_text": "..."
    }
    """
    payload = await request.json()

    # Verificar secret para seguridad
    if payload.get("secret") != settings.n8n_webhook_secret:
        raise HTTPException(status_code=403, detail="Secret invalido")

    contract_id = payload.get("contract_id")
    status = payload.get("status", "error")

    contract = await Contract.get(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    if status == "error":
        contract.status = ContractStatus.ERROR
        contract.error_message = payload.get("error_message", "Error desconocido en el procesamiento")
        await contract.save()
        return {"ok": True, "status": "error registrado"}

    # Guardar analisis en MongoDB
    analysis = Analysis(
        contract_id=PydanticObjectId(contract_id),
        user_id=contract.user_id,
        summary=payload.get("summary", ""),
        parties=payload.get("parties", []),
        key_dates=payload.get("key_dates", []),
        risks=payload.get("risks", []),
        clauses=payload.get("clauses", []),
        raw_text=payload.get("raw_text", ""),
    )
    await analysis.insert()

    # Actualizar estado del contrato
    contract.status = ContractStatus.COMPLETED
    contract.processed_at = datetime.utcnow()
    await contract.save()

    return {"ok": True, "analysis_id": str(analysis.id)}


@router.post("/n8n/analysis-progress")
async def n8n_analysis_progress(request: Request):
    """
    Webhook opcional para actualizar el progreso del analisis.
    Permite mostrar al usuario en que etapa esta el procesamiento.
    """
    payload = await request.json()

    if payload.get("secret") != settings.n8n_webhook_secret:
        raise HTTPException(status_code=403, detail="Secret invalido")

    contract_id = payload.get("contract_id")
    contract = await Contract.get(contract_id)

    if contract:
        contract.status = ContractStatus.PROCESSING
        await contract.save()

    return {"ok": True}
