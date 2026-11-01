"""Webhooks que llama n8n al terminar (o avanzar) el análisis de un contrato."""

import pytest

from app.core.config import settings
from app.models.analysis import Analysis
from app.models.contrato import Contrato

from .conftest import SECRET_N8N, url_blob

URL_COMPLETO = "/webhooks/n8n/analysis-complete"
URL_PROGRESO = "/webhooks/n8n/analysis-progress"


async def nuevo_contrato(user_id: str = "user-a") -> Contrato:
    contrato = Contrato(usuario_id=user_id, contrato_url=url_blob(user_id))
    await contrato.insert()
    return contrato


async def test_analisis_completo_guarda_el_resultado(client):
    contrato = await nuevo_contrato()
    r = await client.post(URL_COMPLETO, json={
        "secret": SECRET_N8N,
        "contract_id": str(contrato.id),
        "status": "completado",
        "summary": "Resumen",
        "risks": [{"clause": "5", "description": "Multa", "severity": "high"}],
        "raw_text": "texto",
    })
    assert r.status_code == 200

    actualizado = await Contrato.get(contrato.id)
    assert actualizado.estado == "completado"
    analysis = await Analysis.find_one(Analysis.contract_id == contrato.id)
    assert analysis.summary == "Resumen"
    assert analysis.user_id == "user-a"   # el dueño sale del contrato, no del payload


async def test_analisis_con_error_marca_el_contrato(client):
    contrato = await nuevo_contrato()
    r = await client.post(URL_COMPLETO, json={"secret": SECRET_N8N, "contract_id": str(contrato.id), "status": "error"})
    assert r.status_code == 200
    assert (await Contrato.get(contrato.id)).estado == "error"
    assert await Analysis.count() == 0


async def test_progreso_marca_procesando(client):
    contrato = await nuevo_contrato()
    r = await client.post(URL_PROGRESO, json={"secret": SECRET_N8N, "contract_id": str(contrato.id)})
    assert r.status_code == 200
    assert (await Contrato.get(contrato.id)).estado == "procesando"


@pytest.mark.parametrize("url", [URL_COMPLETO, URL_PROGRESO])
async def test_rechaza_secret_incorrecto(client, url):
    contrato = await nuevo_contrato()
    r = await client.post(url, json={"secret": "otro", "contract_id": str(contrato.id), "status": "completado"})
    assert r.status_code == 403
    assert (await Contrato.get(contrato.id)).estado == "pendiente"


@pytest.mark.parametrize("url", [URL_COMPLETO, URL_PROGRESO])
async def test_rechaza_todo_si_el_secret_no_esta_configurado(client, monkeypatch, url):
    monkeypatch.setattr(settings, "n8n_webhook_secret", "")
    contrato = await nuevo_contrato()
    r = await client.post(url, json={"secret": "", "contract_id": str(contrato.id), "status": "completado"})
    assert r.status_code == 403
    assert (await Contrato.get(contrato.id)).estado == "pendiente"


@pytest.mark.parametrize("url", [URL_COMPLETO, URL_PROGRESO])
async def test_id_invalido_devuelve_404(client, url):
    r = await client.post(url, json={"secret": SECRET_N8N, "contract_id": "no-es-un-id", "status": "completado"})
    assert r.status_code == 404


async def test_contrato_inexistente_devuelve_404(client):
    r = await client.post(URL_COMPLETO, json={
        "secret": SECRET_N8N, "contract_id": "64b7f0000000000000000000", "status": "completado",
    })
    assert r.status_code == 404
