"""Pydantic schemas for query and upload responses."""
from pydantic import BaseModel, Field


class QueryBody(BaseModel):
    question: str = Field(..., min_length=1, max_length=10000)
    top_k: int = Field(default=4, ge=1, le=20)


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict] = Field(default_factory=list)
    chat_id: str | None = None


class UploadResponse(BaseModel):
    message: str
