import httpx
from app.core.config import settings


async def trigger_contract_analysis(contract_id: str, s3_key: str, user_id: str) -> bool:
    """
    Dispara el webhook de n8n para iniciar el procesamiento del contrato.
    n8n tomara el contrato de S3, lo analizara con LLM y guardara el resultado en MongoDB.
    """
    payload = {
        "contract_id": contract_id,
        "s3_key": s3_key,
        "user_id": user_id,
        "secret": settings.n8n_webhook_secret,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.n8n_webhook_url,
                json=payload,
            )
            return response.status_code == 200
    except Exception as e:
        print(f"[n8n] Error al disparar webhook: {e}")
        return False
