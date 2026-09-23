from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import verify_clerk_token
from app.models.contract import Contract, ContractStatus
from app.models.chat_session import ChatSession
from app.models.analysis import Analysis
from app.services.llm import answer_contract_question
from beanie import PydanticObjectId
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    question: str


@router.post("/{contract_id}")
async def chat_with_contract(
    contract_id: str,
    body: ChatRequest,
    user: dict = Depends(verify_clerk_token),
):
    """
    Recibe una pregunta del usuario sobre un contrato y retorna la respuesta del LLM.
    El contrato debe estar en estado 'completed' (analisis terminado).
    """
    user_id = user["sub"]

    # Verificar que el contrato existe y pertenece al usuario
    contract = await Contract.get(contract_id)
    if not contract or contract.user_id != user_id:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    if contract.status != ContractStatus.COMPLETED:
        raise HTTPException(
            status_code=409,
            detail=f"El contrato aun se esta procesando (estado: {contract.status})"
        )

    # Buscar o crear sesion de chat para este contrato
    session = await ChatSession.find_one(
        ChatSession.contract_id == PydanticObjectId(contract_id),
        ChatSession.user_id == user_id,
    )

    if not session:
        session = ChatSession(
            contract_id=PydanticObjectId(contract_id),
            user_id=user_id,
            messages=[],
        )
        await session.insert()

    # Obtener respuesta del LLM usando el analisis como contexto
    answer = await answer_contract_question(
        contract_id=contract_id,
        question=body.question,
        chat_history=session.messages,
    )

    # Guardar el intercambio en el historial
    session.messages.append({"role": "user", "content": body.question, "timestamp": datetime.utcnow().isoformat()})
    session.messages.append({"role": "assistant", "content": answer, "timestamp": datetime.utcnow().isoformat()})
    session.updated_at = datetime.utcnow()
    await session.save()

    return {"answer": answer, "session_id": str(session.id)}


@router.get("/{contract_id}/history")
async def get_chat_history(contract_id: str, user: dict = Depends(verify_clerk_token)):
    """Retorna el historial completo de chat para un contrato."""
    user_id = user["sub"]

    session = await ChatSession.find_one(
        ChatSession.contract_id == PydanticObjectId(contract_id),
        ChatSession.user_id == user_id,
    )

    if not session:
        return {"messages": []}

    return {"messages": session.messages, "session_id": str(session.id)}
