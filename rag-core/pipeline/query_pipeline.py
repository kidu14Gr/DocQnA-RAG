from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore

class QueryPipeline:
    """
    Take user question → embed → search FAISS → return relevant chunks
    """

    def __init__(self):
        self.embedder = Embedder()
        self.store = VectorStore()

    # --------------------------------------------

    def query(self, question: str, top_k: int = 4):
        # 1️⃣ Embed the question
        question_vector = self.embedder.embed_text(question)

        # 2️⃣ Search FAISS
        results = self.store.search(question_vector, top_k=top_k)

        return results