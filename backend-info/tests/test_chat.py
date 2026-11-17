"""Chat con un contrato (sin llamar a OpenAI: la respuesta del modelo se simula)."""

import pytest

from app.models.chat_session import ChatSession
from app.models.contrato import Contrato
from app.routes import chat as rutas_chat

from .conftest import como, url_blob


@pytest.fixture
def respuestas_llm(monkeypatch):
    preguntas = []

    async def llm_falso(contract_id, question, chat_history):
        preguntas.append({"question": question, "historial": list(chat_history)})
        return f"Respuesta a: {question}"

    monkeypatch.setattr(rutas_chat, "answer_contract_question", llm_falso)
    return preguntas


async def nuevo_contrato(user_id: str = "user-a", estado: str = "completado") -> Contrato:
    contrato = Contrato(usuario_id=user_id, contrato_url=url_blob(user_id), estado=estado)
    await contrato.insert()
    return contrato


async def test_pregunta_y_guarda_el_historial(client, respuestas_llm):
    contrato = await nuevo_contrato()

    r = await client.post(f"/chat/{contrato.id}", json={"question": "¿Cuándo vence?"}, headers=como("user-a"))
    assert r.status_code == 200
    assert r.json()["answer"] == "Respuesta a: ¿Cuándo vence?"

    r = await client.post(f"/chat/{contrato.id}", json={"question": "¿Y la multa?"}, headers=como("user-a"))
    assert r.status_code == 200
    # La segunda pregunta recibe el intercambio anterior como contexto
    assert len(respuestas_llm[1]["historial"]) == 2

    r = await client.get(f"/chat/{contrato.id}/history", headers=como("user-a"))
    assert [m["role"] for m in r.json()["messages"]] == ["user", "assistant", "user", "assistant"]


async def test_contrato_sin_analizar_devuelve_409(client, respuestas_llm):
    contrato = await nuevo_contrato(estado="procesando")
    r = await client.post(f"/chat/{contrato.id}", json={"question": "hola"}, headers=como("user-a"))
    assert r.status_code == 409
    assert respuestas_llm == []


async def test_no_se_puede_chatear_con_el_contrato_de_otro(client, respuestas_llm):
    contrato = await nuevo_contrato("user-a")
    r = await client.post(f"/chat/{contrato.id}", json={"question": "hola"}, headers=como("user-b"))
    assert r.status_code == 404
    assert respuestas_llm == []


async def test_historial_de_otro_usuario_vuelve_vacio(client, respuestas_llm):
    contrato = await nuevo_contrato("user-a")
    await client.post(f"/chat/{contrato.id}", json={"question": "hola"}, headers=como("user-a"))

    r = await client.get(f"/chat/{contrato.id}/history", headers=como("user-b"))
    assert r.status_code == 200
    assert r.json()["messages"] == []
    assert await ChatSession.count() == 1


async def test_id_invalido_devuelve_404(client, respuestas_llm):
    r = await client.post("/chat/no-es-un-id", json={"question": "hola"}, headers=como("user-a"))
    assert r.status_code == 404
    r = await client.get("/chat/no-es-un-id/history", headers=como("user-a"))
    assert r.status_code == 404
