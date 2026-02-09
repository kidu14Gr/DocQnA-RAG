from rag_core.pipeline.ingest_pipeline import IngestPipeline
from rag_core.pipeline.query_pipeline import QueryPipeline

class RAGService:
    def __init__(self):
        self.ingest_pipeline = IngestPipeline()
        self.query_pipeline = QueryPipeline()

    def ingest_pdf(self, file_path: str):
        self.ingest_pipeline.ingest_pdf(file_path)

    def ingest_docx(self, file_path: str):
        self.ingest_pipeline.ingest_docx(file_path)

    def query(self, question: str, top_k: int = 4):
        return self.query_pipeline.query(question, top_k)