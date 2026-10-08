"""
Verificación de JWT de Supabase para proteger endpoints de FastAPI.

Decodifica el token JWT enviado por el frontend (via @supabase/ssr)
y extrae el `sub` (user ID) del payload. Usa la clave pública (JWT Secret)
del proyecto de Supabase para verificar la firma.
"""

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Decodifica y verifica el JWT de Supabase.
    Retorna el payload completo (incluye 'sub' con el user ID).
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
