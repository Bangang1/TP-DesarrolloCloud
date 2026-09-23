import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


async def upload_file_to_s3(file_content: bytes, filename: str, user_id: str) -> str:
    """
    Sube un archivo a S3 y retorna el s3_key.
    Organiza los archivos por usuario: uploads/{user_id}/{uuid}_{filename}
    """
    s3_client = get_s3_client()
    unique_filename = f"{uuid.uuid4()}_{filename}"
    s3_key = f"uploads/{user_id}/{unique_filename}"

    s3_client.put_object(
        Bucket=settings.aws_bucket_name,
        Key=s3_key,
        Body=file_content,
        ContentType="application/pdf",
        ServerSideEncryption="AES256",   # Cifrado en reposo
    )

    return s3_key


def get_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """
    Genera una URL temporal firmada para descargar un archivo de S3.
    Por defecto expira en 1 hora.
    """
    s3_client = get_s3_client()
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.aws_bucket_name, "Key": s3_key},
            ExpiresIn=expiration,
        )
        return url
    except ClientError:
        return ""
