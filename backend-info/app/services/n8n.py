import httpx
from app.core.config import settings
from app.services.storage import get_download_url


<<<<<<< HEAD
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
=======
async def trigger_contract_analysis(contrato_id: str, contrato_url: str, usuario_id: str) -> bool:
    """
    Dispara el webhook de n8n para iniciar el analisis del contrato.
    `contrato_url` debe ser una URL con SAS de lectura: n8n descarga el PDF, lo analiza con el LLM y
    devuelve el resultado a /webhooks/n8n/analysis-complete.
    Se ejecuta como BackgroundTask: los errores se loguean y no se propagan.
    """
    payload = {
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
        "secret": settings.n8n_webhook_secret,
        "contrato_id": contrato_id,
        "contrato_url": contrato_url,
        "usuario_id": usuario_id,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(settings.n8n_webhook_url, json=payload)
            if response.status_code == 200:
                print(f"[n8n] Webhook disparado OK para contrato {contrato_id}")
                return True
            print(f"[n8n] Respuesta inesperada ({response.status_code}) para contrato {contrato_id}")
            return False
    except Exception as e:
        print(f"[n8n] Error al disparar webhook: {e}")
        return False
