from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import shutil, os
from services.rag_service import RAGService

app = FastAPI(title="AI Docs RAG Backend")
rag_service = RAGService()

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploaded_docs")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --------------------------------------------
# Upload PDF endpoint
@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        return JSONResponse({"error": "Only PDF files allowed"}, status_code=400)

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    rag_service.ingest_pdf(file_path)
    return JSONResponse({"message": f"{file.filename} ingested successfully!"})


# --------------------------------------------
# Upload DOCX endpoint
@app.post("/upload/docx")
async def upload_docx(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".docx"):
        return JSONResponse({"error": "Only DOCX files allowed"}, status_code=400)

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    rag_service.ingest_docx(file_path)
    return JSONResponse({"message": f"{file.filename} ingested successfully!"})


# --------------------------------------------
# Query endpoint
@app.post("/query")
async def query(question: str = Form(...), top_k: int = Form(4)):
    results = rag_service.query(question, top_k)
    return JSONResponse(results)