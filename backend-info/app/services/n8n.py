import httpx
from app.core.config import settings
from app.services.storage import get_download_url


async def trigger_contract_analysis(contract_id: str, blob_name: str, user_id: str) -> bool:
    """
    Dispara el webhook de n8n para iniciar el procesamiento del contrato.
    n8n descarga el archivo desde file_url (URL temporal de Azure), lo analiza con LLM
    y avisa el resultado al webhook del backend.
    """
    payload = {
        "contract_id": contract_id,
        "blob_name": blob_name,
        "file_url": get_download_url(blob_name),
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
