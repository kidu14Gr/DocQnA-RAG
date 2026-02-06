from ingestion.pdf_loader import load_and_chunk_pdf
from ingestion.docx_loader import load_and_chunk_docx
from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore

class IngestPipeline:
    """
    Orchestrates document → chunks → embeddings → FAISS
    """

    def __init__(self):
        self.embedder = Embedder()
        self.store = VectorStore()

    # --------------------------------------------

    def ingest_pdf(self, file_path: str):
        # 1️⃣ Load & chunk PDF
        chunks = load_and_chunk_pdf(file_path, chunk_size=500, overlap=100)

        # 2️⃣ Embed
        embedded_chunks = self.embedder.embed_chunks(chunks)

        # 3️⃣ Add to FAISS
        self.store.add_embeddings(
            [c["embedding"] for c in embedded_chunks],
            embedded_chunks
        )

        print(f"Ingested {len(embedded_chunks)} chunks from PDF: {file_path}")

    # --------------------------------------------

    def ingest_docx(self, file_path: str):
        # 1️⃣ Load & chunk DOCX
        chunks = load_and_chunk_docx(file_path, chunk_size=500, overlap=100)

        # 2️⃣ Embed
        embedded_chunks = self.embedder.embed_chunks(chunks)

        # 3️⃣ Add to FAISS
        self.store.add_embeddings(
            [c["embedding"] for c in embedded_chunks],
            embedded_chunks
        )

        print(f"Ingested {len(embedded_chunks)} chunks from DOCX: {file_path}")