# AI Document RAG Chatbot

AI‑powered question‑answering chatbot that bundles a **responsive React frontend**, a **FastAPI backend**,
a PostgreSQL database and a FAISS vector store. Entire stack is open-source and can be run locally via
**Docker Compose** or developed independently.

## Key Features

- **Responsive frontend** with React, TypeScript, Vite and Tailwind CSS.
- **Backend API** using FastAPI for ingestion, querying, authentication, and chat history.
- **JWT multi-user support** with per-user vector isolation and storage.
- **Vector retrieval** powered by FAISS embeddings.
- **Persistent chat logs** stored in PostgreSQL via SQLAlchemy.
- **Docker Compose ready**: backend + database (and optionally static frontend files) in one command.
- **RAG pipeline** using CPU‑friendly LLMs for retrieval‑augmented generation.

## Architecture Overview

```mermaid
graph LR
  subgraph frontend
    A[React SPA]
  end

  subgraph backend
    B[FastAPI]
    B --> C[SQLAlchemy/PostgreSQL]
    B --> D[FAISS vector store]
    B --> E[RAG logic (rag_core)]
  end

  A -->|HTTP| B
```

- Frontend in `frontend/` handles uploads, chat UI and user interactions.
- Backend in `backend/app/` exposes `/upload`, `/query`, `/chat`, `/auth` routes.
- Data layer: PostgreSQL for users/chat, filesystem for documents, FAISS for embeddings.
- Core RAG code lives in `rag_core/` and is framework-agnostic.

## Frontend (Responsive UI)

A small React + Vite single-page application. Key points:

- Component-driven with `App.tsx` coordinating `UploadSection`, `ChatSection`, etc.
- Tailwind CSS provides responsive styling; layout adapts to mobile and desktop.
- Proxy configuration allows dev server to forward API calls to backend (see `vite.config.ts`).
- `src/lib/api.ts` centralizes HTTP calls and error handling.

> See `frontend/README.md` for exhaustive details on files, flows, and extensions.

## Backend

- FastAPI application in `backend/app/`.
- URL structure:
  - `POST /auth/signup`, `/auth/login` – returns JWT tokens.
  - `POST /upload/pdf` and `/upload/docx` – accepts file uploads.
  - `POST /query` – send question and receive answer + sources.
  - `POST /chat/general` – public chat endpoint (no auth).
- Services encapsulate RAG logic (`rag_service.py`), storage paths, and chat persistence.
- Configuration via environment variables (`backend/app/core/config.py`).
- SQLAlchemy models for `User`, `Document`, `ChatHistory` under `backend/app/models/`.

## Database

- PostgreSQL provides user accounts and chat histories.
- Schema defined through SQLAlchemy models and created via `init_db()`.
- Included in Docker Compose as the `db` service.

## Vector Store

- FAISS index stored under `data/faiss_index*`.
- Each user has a separate index file to isolate their documents.
- Embeddings generated using `sentence-transformers/all-mpnet-base-v2`.

## Docker

The project includes a `docker-compose.yml` and backend `Dockerfile`:

1. Copy `.env.example` to `.env` and set at least:
   - `POSTGRES_PASSWORD`, `JWT_SECRET_KEY` (long random string).
   - `GROQ_API_KEY`, `HF_TOKEN` for RAG model access.
2. From project root: `docker compose up --build`.
3. Backend: http://localhost:8000 — API docs at http://localhost:8000/docs.

The frontend can run separately via `npm run dev` or be built and served as static files by the backend.

## Running Locally Without Docker

You can install dependencies manually:

- Python: create a venv, `pip install -r requirements.txt`.
- PostgreSQL: run locally and set `DATABASE_URL` accordingly.
- Start FastAPI with `uvicorn backend.app.main:app --reload`.
- Frontend: `cd frontend && npm install && npm run dev`.

## Project Layout

```
backend/           # FastAPI app and modules
rag_core/          # RAG pipeline code (ingestion, retrieval, generation)
frontend/          # React + Vite user interface
data/              # FAISS indexes (ignored by git, see .gitignore)
uploaded_docs/     # raw document files (ignored by git)
```

## Development Notes

- Empty directories are preserved with `.gitkeep` files; all other contents are ignored.
- Uploaded documents and vector stores should not be committed (see .gitignore).
- Add more document types by extending both frontend validation and backend endpoints.
- Swap FAISS for another vector store with minimal changes in `rag_core/retrieval/vector_store.py`.

## Extensibility & Ideas

- Persist chat history in frontend (local storage) or extend backend for user-specific sessions.
- Replace the simulated upload progress with real-time progress events.
- Add authentication/authorization policies (roles, refresh tokens).
- Integrate alternate LLMs or external search providers.

---

This README aims to be a one‑stop summary; for component-level details refer to the
`frontend/README.md` and inline comments in the Python modules.
