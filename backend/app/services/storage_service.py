"""
Per-user storage paths. No RAG logic; only path resolution.
"""
import os
import uuid
from pathlib import Path

from ..core import get_settings


def get_user_storage_root(user_id: uuid.UUID) -> Path:
    base = get_settings().get_storage_path()
    return base / "users" / str(user_id)


def get_user_documents_dir(user_id: uuid.UUID) -> Path:
    p = get_user_storage_root(user_id) / "documents"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_user_vectors_dir(user_id: uuid.UUID) -> Path:
    p = get_user_storage_root(user_id) / "vectors"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_user_metadata_dir(user_id: uuid.UUID) -> Path:
    p = get_user_storage_root(user_id) / "metadata"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_user_faiss_index_path(user_id: uuid.UUID) -> str:
    """Path to FAISS index file for this user (for VectorStore)."""
    model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    model_key = model_name.replace("/", "__").replace(":", "_")
    return str(get_user_vectors_dir(user_id) / f"faiss_index_{model_key}")


def safe_save_upload(user_id: uuid.UUID, filename: str, content: bytes) -> Path:
    """
    Save uploaded file under user's documents dir with a unique name to avoid overwrites.
    Returns path to the saved file.
    """
    doc_dir = get_user_documents_dir(user_id)
    # Keep extension; prefix with uuid to avoid collisions
    stem = Path(filename).stem[:200]
    ext = Path(filename).suffix.lower() or ""
    safe_name = f"{uuid.uuid4().hex[:12]}_{stem}{ext}"
    path = doc_dir / safe_name
    path.write_bytes(content)
    return path
