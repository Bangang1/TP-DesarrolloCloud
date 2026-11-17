import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import BlobSasPermissions, ContentSettings, generate_blob_sas
from azure.storage.blob.aio import BlobServiceClient
from app.core.config import settings


def _account_url() -> str:
    return f"https://{settings.azure_storage_account_name}.blob.core.windows.net"


async def upload_file(file_content: bytes, filename: str, user_id: str, content_type: str) -> str:
    """
    Sube un archivo a Azure Blob Storage y retorna el nombre del blob.
    Organiza los archivos por usuario: uploads/{user_id}/{uuid}_{filename}
    """
    blob_name = f"uploads/{user_id}/{uuid.uuid4()}_{filename}"
    content_settings = ContentSettings(content_type=content_type)

    async with BlobServiceClient(_account_url(), credential=settings.azure_storage_account_key) as service:
        container = service.get_container_client(settings.azure_storage_container_name)
        try:
            await container.upload_blob(blob_name, file_content, content_settings=content_settings)
        except ResourceNotFoundError:
            await container.create_container()
            await container.upload_blob(blob_name, file_content, content_settings=content_settings)

    return blob_name


def get_download_url(blob_name: str, expiration: int = 3600) -> str:
    """Genera una URL temporal firmada (SAS) para descargar un blob. Por defecto expira en 1 hora."""
    sas = generate_blob_sas(
        account_name=settings.azure_storage_account_name,
        container_name=settings.azure_storage_container_name,
        blob_name=blob_name,
        account_key=settings.azure_storage_account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(seconds=expiration),
    )
    return f"{_account_url()}/{settings.azure_storage_container_name}/{quote(blob_name)}?{sas}"
