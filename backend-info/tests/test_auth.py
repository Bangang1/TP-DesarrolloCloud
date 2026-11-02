"""Verificación de los JWT de Supabase (ES256 con JWKS y legacy HS256)."""

import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwk, jwt

from app.core import auth
from app.core.config import settings

SECRET_HS256 = "secreto-legacy-de-prueba-con-largo-suficiente"
KID = "clave-de-prueba"


def _pem_privada(clave) -> bytes:
    return clave.private_bytes(
        serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
    )


def _jwk_publica(clave, kid: str) -> dict:
    pem = clave.public_key().public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
    )
    datos = jwk.construct(pem, "ES256").to_dict()
    datos["kid"] = kid
    return datos


CLAVE_EC = ec.generate_private_key(ec.SECP256R1())
OTRA_CLAVE_EC = ec.generate_private_key(ec.SECP256R1())


def _claims(**cambios) -> dict:
    claims = {"sub": "user-123", "aud": "authenticated", "exp": int(time.time()) + 3600}
    claims.update(cambios)
    return claims


def token_hs256(secret: str = SECRET_HS256, **cambios) -> str:
    return jwt.encode(_claims(**cambios), secret, algorithm="HS256")


def token_es256(clave=CLAVE_EC, kid: str = KID, **cambios) -> str:
    return jwt.encode(_claims(**cambios), _pem_privada(clave), algorithm="ES256", headers={"kid": kid})


@pytest.fixture(autouse=True)
def supabase_configurado(monkeypatch):
    monkeypatch.setattr(settings, "supabase_url", "https://proyecto.supabase.co")
    monkeypatch.setattr(settings, "supabase_jwt_secret", SECRET_HS256)

    async def jwks_falso(forzar: bool = False):
        return [_jwk_publica(CLAVE_EC, KID)]

    monkeypatch.setattr(auth, "_obtener_jwks", jwks_falso)


async def verificar(token: str) -> dict:
    return await auth.verify_supabase_token(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token))


async def assert_401(token: str):
    with pytest.raises(HTTPException) as exc:
        await verificar(token)
    assert exc.value.status_code == 401


async def test_es256_valido():
    assert (await verificar(token_es256()))["sub"] == "user-123"


async def test_hs256_valido():
    assert (await verificar(token_hs256()))["sub"] == "user-123"


async def test_rechaza_token_vencido():
    await assert_401(token_es256(exp=int(time.time()) - 10))


async def test_rechaza_firma_de_otra_clave():
    await assert_401(token_es256(clave=OTRA_CLAVE_EC))


async def test_rechaza_kid_desconocido():
    await assert_401(token_es256(kid="otro-kid"))


async def test_rechaza_hs256_con_otro_secret():
    await assert_401(token_hs256(secret="otro-secret-cualquiera-con-largo-suficiente"))


async def test_rechaza_audiencia_incorrecta():
    await assert_401(token_es256(aud="anon"))


async def test_rechaza_token_malformado():
    await assert_401("esto.no.es-un-jwt")


async def test_rechaza_hs256_si_no_hay_secret_configurado(monkeypatch):
    monkeypatch.setattr(settings, "supabase_jwt_secret", "")
    await assert_401(token_hs256())


async def test_rechaza_alg_none():
    sin_firma = jwt.encode(_claims(), "", algorithm="HS256").rsplit(".", 1)[0] + "."
    await assert_401(sin_firma)
