import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Verifica el token JWT de Clerk contra la API de Clerk.
    Retorna el payload del usuario si es valido.
    """
    token = credentials.credentials
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.clerk.com/v1/tokens/verify",
            headers={
                "Authorization": f"Bearer {settings.clerk_secret_key}",
                "Content-Type": "application/json",
            },
            params={"token": token},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    return response.json()
