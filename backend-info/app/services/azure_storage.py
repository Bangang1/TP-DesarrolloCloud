"""
Acceso a Azure Blob Storage desde el backend.

El frontend sube los PDFs directamente a Azure (SAS de escritura generado por
un Server Action). El backend solo necesita:
- validar que la URL recibida apunta a un blob del usuario en nuestro contenedor,
- generar una URL de lectura temporal (SAS) para que n8n descargue el PDF,
- borrar el blob cuando se elimina un contrato.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote, unquote, urlparse

from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas

from app.core.config import settings


def _url_contenedor() -> str:
    return (
        f"https://{settings.azure_storage_account_name}.blob.core.windows.net/"
        f"{settings.azure_storage_container_name}/"
    )


def azure_configurado() -> bool:
    return bool(
        settings.azure_storage_account_name
        and settings.azure_storage_account_key
        and settings.azure_storage_container_name
    )


def nombre_blob_desde_url(url: str) -> Optional[str]:
    """
    Extrae el nombre del blob de una URL de nuestro contenedor.
    Retorna None si la URL no pertenece a la cuenta/contenedor configurados.
    """
    parsed = urlparse(url)
    if parsed.query or parsed.fragment:
        return None
    base = _url_contenedor()
    url_sin_query = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if not url_sin_query.startswith(base):
        return None
    nombre = unquote(url_sin_query[len(base):])
    if not nombre or ".." in nombre.split("/"):
        return None
    return nombre


def blob_pertenece_al_usuario(url: str, usuario_id: str) -> bool:
    """Los PDFs se suben a contratos/{usuario_id}/{uuid}.pdf."""
    nombre = nombre_blob_desde_url(url)
    return nombre is not None and nombre.startswith(f"contratos/{usuario_id}/")


def generar_url_lectura(url: str, minutos: int = 60) -> str:
    """Devuelve la URL del blob con un SAS de solo lectura que expira en `minutos`."""
    nombre = nombre_blob_desde_url(url)
    if nombre is None:
        raise ValueError("La URL no pertenece al contenedor de Azure configurado")

    sas = generate_blob_sas(
        account_name=settings.azure_storage_account_name,
        container_name=settings.azure_storage_container_name,
        blob_name=nombre,
        account_key=settings.azure_storage_account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=minutos),
    )
    return f"{_url_contenedor()}{quote(nombre)}?{sas}"


def eliminar_blob(url: str) -> None:
    """
    Borra el blob en Azure. Pensado para correr como BackgroundTask (sync →
    FastAPI lo ejecuta en un threadpool). Los errores se loguean y no se propagan.
    """
    nombre = nombre_blob_desde_url(url)
    if nombre is None:
        print(f"[Azure] URL fuera del contenedor, no se borra: {url}")
        return

    try:
        cliente = BlobServiceClient(
            account_url=f"https://{settings.azure_storage_account_name}.blob.core.windows.net",
            credential={
                "account_name": settings.azure_storage_account_name,
                "account_key": settings.azure_storage_account_key,
            },
        )
        cliente.get_blob_client(settings.azure_storage_container_name, nombre).delete_blob(
            delete_snapshots="include"
        )
        print(f"[Azure] Blob eliminado: {nombre}")
    except Exception as e:
        print(f"[Azure] Error al eliminar blob {nombre}: {e}")
