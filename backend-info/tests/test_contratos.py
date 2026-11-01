"""Endpoints /api/contratos: alta, listado, detalle, borrado y aislamiento entre usuarios."""

from app.models.analysis import Analysis
from app.models.chat_session import ChatSession
from app.models.contrato import Contrato

from .conftest import como, url_blob


async def crear(client, user_id: str, archivo: str = "abc.pdf", nombre: str = "Contrato.pdf") -> str:
    r = await client.post(
        "/api/contratos/analizar",
        json={"contrato_url": url_blob(user_id, archivo), "nombre_archivo": nombre},
        headers=como(user_id),
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


async def test_sin_token_devuelve_401(client):
    r = await client.get("/api/contratos/")
    assert r.status_code == 401


async def test_crear_contrato_lo_guarda_y_dispara_n8n(client, llamadas_n8n):
    contrato_id = await crear(client, "user-a")

    contrato = await Contrato.get(contrato_id)
    assert contrato.usuario_id == "user-a"
    assert contrato.estado == "pendiente"
    assert contrato.nombre_archivo == "Contrato.pdf"

    assert len(llamadas_n8n) == 1
    llamada = llamadas_n8n[0]
    assert llamada["contrato_id"] == contrato_id
    assert llamada["usuario_id"] == "user-a"
    # n8n recibe una URL con permiso de lectura temporal (SAS)
    assert "sig=" in llamada["contrato_url"] and "sp=r" in llamada["contrato_url"]


async def test_el_duenio_sale_del_token_no_del_body(client):
    r = await client.post(
        "/api/contratos/analizar",
        json={"contrato_url": url_blob("user-a"), "usuario_id": "user-b"},
        headers=como("user-a"),
    )
    assert r.status_code == 200
    contrato = await Contrato.get(r.json()["id"])
    assert contrato.usuario_id == "user-a"


async def test_no_se_puede_registrar_el_pdf_de_otro_usuario(client, llamadas_n8n):
    r = await client.post(
        "/api/contratos/analizar",
        json={"contrato_url": url_blob("user-b")},
        headers=como("user-a"),
    )
    assert r.status_code == 400
    assert await Contrato.count() == 0
    assert llamadas_n8n == []


async def test_listar_devuelve_solo_los_propios_del_mas_nuevo_al_mas_viejo(client):
    primero = await crear(client, "user-a", "1.pdf", "Primero.pdf")
    segundo = await crear(client, "user-a", "2.pdf", "Segundo.pdf")
    await crear(client, "user-b", "3.pdf")

    r = await client.get("/api/contratos/", headers=como("user-a"))
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert ids == [segundo, primero]
    assert r.json()[0]["status"] == "pending"


async def test_listar_informa_el_riesgo_mas_alto(client):
    contrato_id = await crear(client, "user-a")
    contrato = await Contrato.get(contrato_id)
    await Analysis(
        contract_id=contrato.id, user_id="user-a", summary="s",
        risks=[{"severity": "low"}, {"severity": "high"}, {"severity": "medium"}],
    ).insert()

    r = await client.get("/api/contratos/", headers=como("user-a"))
    assert r.json()[0]["risk"] == "high"


async def test_detalle_incluye_el_analisis(client):
    contrato_id = await crear(client, "user-a")
    contrato = await Contrato.get(contrato_id)
    await Analysis(contract_id=contrato.id, user_id="user-a", summary="Resumen", parties=["A", "B"]).insert()

    r = await client.get(f"/api/contratos/{contrato_id}", headers=como("user-a"))
    assert r.status_code == 200
    assert r.json()["analysis"]["summary"] == "Resumen"
    assert r.json()["analysis"]["parties"] == ["A", "B"]


async def test_detalle_sin_analisis_todavia(client):
    contrato_id = await crear(client, "user-a")
    r = await client.get(f"/api/contratos/{contrato_id}", headers=como("user-a"))
    assert r.status_code == 200
    assert r.json()["analysis"] is None


async def test_no_se_puede_ver_el_contrato_de_otro_usuario(client):
    contrato_id = await crear(client, "user-a")
    r = await client.get(f"/api/contratos/{contrato_id}", headers=como("user-b"))
    assert r.status_code == 404


async def test_id_invalido_devuelve_404(client):
    r = await client.get("/api/contratos/esto-no-es-un-id", headers=como("user-a"))
    assert r.status_code == 404


async def test_borrar_elimina_contrato_analisis_y_chat(client):
    contrato_id = await crear(client, "user-a")
    contrato = await Contrato.get(contrato_id)
    await Analysis(contract_id=contrato.id, user_id="user-a", summary="s").insert()
    await ChatSession(contract_id=contrato.id, user_id="user-a", messages=[]).insert()

    r = await client.delete(f"/api/contratos/{contrato_id}", headers=como("user-a"))
    assert r.status_code == 204
    assert await Contrato.get(contrato_id) is None
    assert await Analysis.count() == 0
    assert await ChatSession.count() == 0


async def test_no_se_puede_borrar_el_contrato_de_otro_usuario(client):
    contrato_id = await crear(client, "user-a")
    r = await client.delete(f"/api/contratos/{contrato_id}", headers=como("user-b"))
    assert r.status_code == 404
    assert await Contrato.get(contrato_id) is not None
