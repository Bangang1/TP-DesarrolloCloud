"""
Fixtures compartidas.

- MongoDB se reemplaza por una base en memoria (mongomock-motor): no hace falta Docker.
- El login se simula: el header "Authorization: Bearer <user_id>" autentica como <user_id>.
  La verificación real de tokens se prueba aparte, en test_auth.py.
- Azure y n8n se configuran con valores de prueba y no se llama a ningún servicio externo.
"""

import pytest
from beanie import init_beanie
from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.auth import security, verify_supabase_token
from app.core.config import settings
from app.main import app
from app.models.analysis import Analysis
from app.models.chat_session import ChatSession
from app.models.contrato import Contrato
from app.routes import contratos as rutas_contratos

CUENTA = "cuentatest"
CONTENEDOR = "contratos"
SECRET_N8N = "secreto-de-prueba"


def url_blob(user_id: str, archivo: str = "abc.pdf") -> str:
    """URL de un PDF subido por `user_id` a nuestro contenedor."""
    return f"https://{CUENTA}.blob.core.windows.net/{CONTENEDOR}/contratos/{user_id}/{archivo}"


@pytest.fixture(autouse=True)
def configuracion(monkeypatch):
    monkeypatch.setattr(settings, "azure_storage_account_name", CUENTA)
    # Clave en base64 válida (Azure la exige para firmar las URLs SAS)
    monkeypatch.setattr(settings, "azure_storage_account_key", "a2V5LWRlLXBydWViYQ==")
    monkeypatch.setattr(settings, "azure_storage_container_name", CONTENEDOR)
    monkeypatch.setattr(settings, "n8n_webhook_secret", SECRET_N8N)


@pytest.fixture(autouse=True)
async def db():
    cliente = AsyncMongoMockClient()
    await init_beanie(database=cliente["test"], document_models=[Contrato, Analysis, ChatSession])
    yield


@pytest.fixture
def llamadas_n8n(monkeypatch):
    """Reemplaza el disparo del webhook de n8n y registra las llamadas."""
    llamadas = []

    async def falso_trigger(contrato_id, contrato_url, usuario_id):
        llamadas.append({"contrato_id": contrato_id, "contrato_url": contrato_url, "usuario_id": usuario_id})
        return True

    monkeypatch.setattr(rutas_contratos, "trigger_contract_analysis", falso_trigger)
    monkeypatch.setattr(rutas_contratos, "eliminar_blob", lambda url: None)
    return llamadas


@pytest.fixture
async def client(llamadas_n8n):
    async def usuario_falso(credentials: HTTPAuthorizationCredentials = Security(security)):
        return {"sub": credentials.credentials}

    app.dependency_overrides[verify_supabase_token] = usuario_falso
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def como(user_id: str) -> dict:
    """Headers para hacer un request autenticado como `user_id`."""
    return {"Authorization": f"Bearer {user_id}"}
