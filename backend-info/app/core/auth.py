import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

_ALGORITHMS = ["ES256", "RS256"]
_jwks_cache: dict | None = None


async def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache
    if _jwks_cache is None or force_refresh:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
        if response.status_code != 200:
            raise HTTPException(status_code=503, detail="No se pudieron obtener las claves de Supabase")
        _jwks_cache = response.json()
    return _jwks_cache


def _find_key(jwks: dict, kid: str | None) -> dict | None:
    return next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Valida el JWT de sesion de Supabase y retorna sus claims (sub = id del usuario)."""
    token = credentials.credentials
    try:
        kid = jwt.get_unverified_header(token).get("kid")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido")

    key = _find_key(await _get_jwks(), kid)
    if key is None:
        # Supabase pudo haber rotado las claves
        key = _find_key(await _get_jwks(force_refresh=True), kid)
    if key is None:
        raise HTTPException(status_code=401, detail="Token invalido")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=_ALGORITHMS,
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")
