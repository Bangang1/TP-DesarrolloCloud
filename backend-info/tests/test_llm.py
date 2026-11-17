"""Servicio de IA del chat: respuesta de mantenimiento mientras no haya API key de OpenAI."""

from openai import OpenAIError

from app.core.config import settings
from app.models.analysis import Analysis
from app.services import llm


async def nuevo_analisis() -> Analysis:
    from beanie import PydanticObjectId
    analysis = Analysis(contract_id=PydanticObjectId(), user_id="user-a", summary="Resumen", raw_text="texto")
    await analysis.insert()
    return analysis


async def test_sin_api_key_responde_mantenimiento(monkeypatch):
    analysis = await nuevo_analisis()
    for key in ("", "COMPLETAR"):
        monkeypatch.setattr(settings, "openai_api_key", key)
        respuesta = await llm.answer_contract_question(str(analysis.contract_id), "¿Cuándo vence?", [])
        assert respuesta == llm.MENSAJE_MANTENIMIENTO


async def test_si_openai_falla_responde_mantenimiento(monkeypatch):
    analysis = await nuevo_analisis()
    monkeypatch.setattr(settings, "openai_api_key", "sk-de-prueba")

    async def falla(**kwargs):
        raise OpenAIError("sin saldo")

    monkeypatch.setattr(llm.client.chat.completions, "create", falla)
    respuesta = await llm.answer_contract_question(str(analysis.contract_id), "¿Cuándo vence?", [])
    assert respuesta == llm.MENSAJE_MANTENIMIENTO
