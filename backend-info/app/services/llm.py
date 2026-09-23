from openai import AsyncOpenAI
from app.core.config import settings
from app.models.analysis import Analysis
from beanie import PydanticObjectId

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def answer_contract_question(
    contract_id: str,
    question: str,
    chat_history: list[dict],
) -> str:
    """
    Responde una pregunta del usuario basandose en el analisis del contrato.
    Usa el texto extraido y el analisis guardado en MongoDB como contexto.
    """
    # Buscar el analisis del contrato
    analysis = await Analysis.find_one(
        Analysis.contract_id == PydanticObjectId(contract_id)
    )

    if not analysis:
        return "Aun no se ha completado el analisis de este contrato. Por favor espera unos minutos."

    # Construir contexto con el analisis
    context = f"""
Eres un asistente legal experto. Tienes acceso al siguiente analisis de un contrato:

RESUMEN: {analysis.summary}

PARTES INVOLUCRADAS: {', '.join(analysis.parties)}

FECHAS CLAVE: {analysis.key_dates}

RIESGOS IDENTIFICADOS: {analysis.risks}

CLAUSULAS RELEVANTES: {analysis.clauses}

TEXTO COMPLETO DEL CONTRATO:
{analysis.raw_text[:8000]}

Responde la pregunta del usuario basandote en esta informacion. Se claro, conciso y profesional.
Si la informacion no esta en el contrato, indicalo claramente.
"""

    messages = [
        {"role": "system", "content": context},
        *chat_history[-10:],  # Ultimos 10 mensajes del historial
        {"role": "user", "content": question},
    ]

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.2,
        max_tokens=1000,
    )

    return response.choices[0].message.content
