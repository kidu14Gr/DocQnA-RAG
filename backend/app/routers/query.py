"""
Query route: document RAG + intent. Protected; uses user's vector store and persists chat history.
Accepts Form for compatibility with existing frontend.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import User
from ..schemas import QueryResponse
from ..services.chat_service import (
    create_chat_session,
    get_chat_session,
    get_recent_history,
    save_turn,
)
from ..services.rag_service import RAGService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["query"])
rag_service = RAGService()


@router.post("/query", response_model=QueryResponse)
def query(
    question: str = Form(..., min_length=1, max_length=10000),
    top_k: int = Form(4, ge=1, le=20),
    chat_id: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = None
    if chat_id:
        try:
            session_uuid = UUID(chat_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid chat_id",
            ) from exc
        session = get_chat_session(db, current_user.id, session_uuid)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
    else:
        session = create_chat_session(db, current_user.id, first_question=question)

    history = get_recent_history(db, current_user.id, session.id)
    try:
        result = rag_service.query(
            current_user.id,
            question,
            top_k=top_k,
            history=history,
        )
    except Exception as e:
        logger.exception("Query failed for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Query failed",
        ) from e
    save_turn(db, current_user.id, session.id, question, result["answer"])
    return QueryResponse(answer=result["answer"], sources=result.get("sources", []), chat_id=str(session.id))
