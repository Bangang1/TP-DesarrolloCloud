import httpx
from app.core.config import settings


async def trigger_contract_analysis(contrato_id: str, contrato_url: str, usuario_id: str) -> bool:
    """
    Dispara el webhook de n8n para iniciar el analisis del contrato.
    `contrato_url` debe ser una URL con SAS de lectura: n8n descarga el PDF, lo analiza con el LLM y
    devuelve el resultado a /webhooks/n8n/analysis-complete.
    Se ejecuta como BackgroundTask: los errores se loguean y no se propagan.
    """
    payload = {
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
