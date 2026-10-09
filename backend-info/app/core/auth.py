"""
Verificación de JWT de Supabase para proteger endpoints de FastAPI.

Decodifica el token JWT enviado por el frontend (via @supabase/ssr)
y extrae el `sub` (user ID) del payload. Soporta los dos esquemas de firma
de Supabase:
- Claves asimétricas (ES256/RS256): se verifican con las claves públicas
  publicadas en {SUPABASE_URL}/auth/v1/.well-known/jwks.json (cacheadas).
- Legacy HS256: se verifica con SUPABASE_JWT_SECRET.
"""

import time

import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

ALGORITMOS_ASIMETRICOS = {"ES256", "RS256"}
JWKS_TTL_SEGUNDOS = 600

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}


async def _obtener_jwks(forzar: bool = False) -> list[dict]:
    """Descarga (y cachea) las claves públicas del proyecto de Supabase."""
    vencido = time.time() - _jwks_cache["fetched_at"] > JWKS_TTL_SEGUNDOS
    if forzar or vencido or not _jwks_cache["keys"]:
        url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
        _jwks_cache["keys"] = response.json().get("keys", [])
        _jwks_cache["fetched_at"] = time.time()
    return _jwks_cache["keys"]


async def _clave_publica(kid: str | None) -> dict | None:
    for forzar in (False, True):  # si el kid no está, refrescar una vez (rotación)
        claves = await _obtener_jwks(forzar=forzar)
        for clave in claves:
            if clave.get("kid") == kid:
                return clave
    return None


def _error_401() -> HTTPException:
    return HTTPException(status_code=401, detail="Token inválido o expirado")


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Decodifica y verifica el JWT de Supabase.
    Retorna el payload completo (incluye 'sub' con el user ID).
    """
    token = credentials.credentials

    try:
        alg = jwt.get_unverified_header(token).get("alg")
    except JWTError:
        raise _error_401()

    if alg in ALGORITMOS_ASIMETRICOS:
        if not settings.supabase_url:
            raise HTTPException(status_code=500, detail="SUPABASE_URL no está configurado en el backend")
        try:
            clave = await _clave_publica(jwt.get_unverified_header(token).get("kid"))
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="No se pudieron obtener las claves de Supabase")
        if clave is None:
            raise _error_401()
        key, algorithms = clave, [alg]
    elif alg == "HS256" and settings.supabase_jwt_secret:
        key, algorithms = settings.supabase_jwt_secret, ["HS256"]
    else:
        raise _error_401()

    try:
        return jwt.decode(token, key, algorithms=algorithms, audience="authenticated")
    except JWTError:
        raise _error_401()
