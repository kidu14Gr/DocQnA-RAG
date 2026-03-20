"""
Public general chat (no auth, no RAG). For general questions only.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import User
from ..services.chat_service import create_chat_session, get_chat_messages, get_chat_session, list_chat_sessions
from ..services.rag_service import _get_llm
from rag_core.generation.prompt_templates import build_general_prompt

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class GeneralChatBody(BaseModel):
    question: str = Field(..., min_length=1, max_length=10000)


class GeneralChatResponse(BaseModel):
    answer: str


class ChatSessionOut(BaseModel):
    id: str
    title: str
    updated_at: str


class ChatMessageOut(BaseModel):
    id: str
    role: str
    message: str
    timestamp: str


class CreateChatSessionBody(BaseModel):
    title: str = Field(default="New Chat", min_length=1, max_length=255)


@router.post("/general", response_model=GeneralChatResponse)
def general_chat(body: GeneralChatBody):
    """Public endpoint: general Q&A without document context or auth."""
    try:
        llm = _get_llm()
        prompt = build_general_prompt(body.question, "")
        answer = llm.generate_general(prompt)
        return GeneralChatResponse(answer=answer)
    except Exception:
        # Keep guest chat responsive even when model credentials are missing
        # or the provider is temporarily unavailable.
        logger.exception("General chat failed")
        return GeneralChatResponse(
            answer=(
                "I am temporarily unable to reach the model service right now. "
                "Please try again shortly. If this keeps happening, check that "
                "the backend LLM API key is configured."
            )
        )


@router.get("/sessions", response_model=list[ChatSessionOut])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = list_chat_sessions(db, current_user.id)
    return [
        ChatSessionOut(
            id=str(s.id),
            title=s.title,
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
        )
        for s in sessions
    ]


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(
    body: CreateChatSessionBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = create_chat_session(db, current_user.id, first_question=body.title)
    return ChatSessionOut(
        id=str(session.id),
        title=session.title,
        updated_at=session.updated_at.isoformat() if session.updated_at else "",
    )


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        from uuid import UUID

        session_uuid = UUID(session_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid session_id",
        ) from exc

    session = get_chat_session(db, current_user.id, session_uuid)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    messages = get_chat_messages(db, current_user.id, session_uuid)
    return [
        ChatMessageOut(
            id=str(m.id),
            role=m.role,
            message=m.message,
            timestamp=m.timestamp.isoformat() if m.timestamp else "",
        )
        for m in messages
    ]
