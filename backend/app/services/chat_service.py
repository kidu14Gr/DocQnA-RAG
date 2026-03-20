"""
Chat history persistence: load last N messages for context, save user + assistant after each turn.
"""
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import ChatHistory, ChatSession

HISTORY_LIMIT = 20
MAX_PROMPTS_PER_CHAT = 10


def _derive_title(question: str) -> str:
    compact = " ".join(question.strip().split())
    return (compact[:80] + "...") if len(compact) > 80 else (compact or "New Chat")


def create_chat_session(db: Session, user_id: UUID, first_question: str = "") -> ChatSession:
    title = _derive_title(first_question)
    session = ChatSession(user_id=user_id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_chat_sessions(db: Session, user_id: UUID) -> list[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc())
        .all()
    )


def get_chat_session(db: Session, user_id: UUID, session_id: UUID) -> ChatSession | None:
    return (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )


def get_chat_messages(db: Session, user_id: UUID, session_id: UUID) -> list[ChatHistory]:
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id, ChatHistory.session_id == session_id)
        .order_by(ChatHistory.timestamp.asc())
        .all()
    )


def count_user_prompts(db: Session, user_id: UUID, session_id: UUID) -> int:
    return (
        db.query(ChatHistory)
        .filter(
            ChatHistory.user_id == user_id,
            ChatHistory.session_id == session_id,
            ChatHistory.role == "user",
        )
        .count()
    )


def get_recent_history(
    db: Session,
    user_id: UUID,
    session_id: UUID,
    limit: int = HISTORY_LIMIT,
) -> str:
    """Return last N messages formatted as 'Human: ...\\nAI: ...' for prompt context."""
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id, ChatHistory.session_id == session_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    rows = list(reversed(rows))
    lines = []
    for r in rows:
        if r.role == "user":
            lines.append(f"Human: {r.message}")
        else:
            lines.append(f"AI: {r.message}")
    return "\n".join(lines) if lines else ""


def save_turn(
    db: Session,
    user_id: UUID,
    session_id: UUID,
    user_message: str,
    assistant_message: str,
) -> None:
    """Persist one user message and one assistant message."""
    db.add(ChatHistory(user_id=user_id, session_id=session_id, role="user", message=user_message))
    db.add(ChatHistory(user_id=user_id, session_id=session_id, role="assistant", message=assistant_message))

    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        # Touch the row to move it up in "recent chats".
        session.updated_at = datetime.now(timezone.utc)
        session.title = session.title or "New Chat"

    db.commit()
