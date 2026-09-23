from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.auth import verify_clerk_token
from app.models.contract import Contract, ContractStatus
from app.services.storage import upload_file_to_s3, get_presigned_url
from app.services.n8n import trigger_contract_analysis
from datetime import datetime

router = APIRouter(prefix="/contracts", tags=["Contracts"])

ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/", status_code=201)
async def upload_contract(
    file: UploadFile = File(...),
    user: dict = Depends(verify_clerk_token),
):
    """Sube un contrato, lo guarda en S3 y dispara el analisis en n8n."""
    user_id = user["sub"]

    # Validar tipo de archivo
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF o DOCX")

    # Leer contenido
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo no puede superar 10MB")

    # Subir a S3
    s3_key = await upload_file_to_s3(content, file.filename, user_id)

    # Crear registro en MongoDB
    contract = Contract(
        user_id=user_id,
        org_id=user.get("org_id"),
        filename=file.filename,
        s3_key=s3_key,
        status=ContractStatus.PENDING,
    )
    await contract.insert()

    # Disparar n8n en background
    triggered = await trigger_contract_analysis(
        contract_id=str(contract.id),
        s3_key=s3_key,
        user_id=user_id,
    )

    if triggered:
        contract.status = ContractStatus.PROCESSING
        await contract.save()

    return {
        "id": str(contract.id),
        "filename": contract.filename,
        "status": contract.status,
        "uploaded_at": contract.uploaded_at,
    }


@router.get("/")
async def list_contracts(user: dict = Depends(verify_clerk_token)):
    """Lista todos los contratos del usuario autenticado."""
    user_id = user["sub"]
    contracts = await Contract.find(Contract.user_id == user_id).to_list()
    return [
        {
            "id": str(c.id),
            "filename": c.filename,
            "status": c.status,
            "uploaded_at": c.uploaded_at,
            "processed_at": c.processed_at,
        }
        for c in contracts
    ]


@router.get("/{contract_id}")
async def get_contract(contract_id: str, user: dict = Depends(verify_clerk_token)):
    """Retorna el detalle de un contrato con URL temporal de descarga."""
    user_id = user["sub"]
    contract = await Contract.get(contract_id)

    if not contract or contract.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    download_url = get_presigned_url(contract.s3_key)

    return {
        "id": str(contract.id),
        "filename": contract.filename,
        "status": contract.status,
        "download_url": download_url,
        "uploaded_at": contract.uploaded_at,
        "processed_at": contract.processed_at,
        "error_message": contract.error_message,
    }


@router.delete("/{contract_id}", status_code=204)
async def delete_contract(contract_id: str, user: dict = Depends(verify_clerk_token)):
    """Elimina un contrato (solo el dueno puede eliminarlo)."""
    user_id = user["sub"]
    contract = await Contract.get(contract_id)

    if not contract or contract.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    await contract.delete()
