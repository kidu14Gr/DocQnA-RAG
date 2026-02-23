"""
AI-DOC-RAG Backend: SaaS-ready multi-user API.
Clean separation: auth and DB in backend; RAG logic in rag_core.
"""
import logging
import os
from contextlib import asynccontextmanager

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass  # Env set by Docker or shell

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .auth import router as auth_router
from .db import init_db
from .routers import chat_router, query_router, upload_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database tables initialized")
    yield
    # Shutdown if needed
    pass


app = FastAPI(
    title="AI Docs RAG Backend",
    description="Multi-user document RAG with auth and per-user storage",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # sometimes used by CRA/spa
    # maybe add other hosts as needed; you can also set allow_origins=["*"]
    # in production if you genuinely have a public API and are careful with
    # credentials (allow_credentials=True). For now we explicitly list
    # dev hosts.
]

# CORS: c origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    # CORS middleware normally adds headers, but some errors may slip
    # through and the frontend ends up with a missing header error. Add a
    # permissive header here so that the client always sees something even
    # if the error originated early in the request lifecycle.
    headers = {"Access-Control-Allow-Origin": "*"}
    if request.headers.get("origin"):
        headers["Access-Control-Allow-Origin"] = request.headers.get("origin")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers=headers,
    )


app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}
