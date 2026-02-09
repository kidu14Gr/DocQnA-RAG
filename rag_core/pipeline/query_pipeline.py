from retrieval.embedder import Embedder
from retrieval.vector_store import VectorStore
from generation.llm_model import LLMModel
from generation.prompt_templates import build_rag_prompt

class QueryPipeline:
    """
    Question → embed → retrieve → prompt → LLM answer
    """

    def __init__(self):
        self.embedder = Embedder()
        self.store = VectorStore()
        self.llm = LLMModel()

    def query(self, question: str, top_k: int = 4):
        # 1️⃣ Embed the question
        question_vector = self.embedder.embed_text(question)

        # 2️⃣ Retrieve relevant chunks
        results = self.store.search(question_vector, top_k=top_k)

        # 3️⃣ Aggregate context
        context = "\n\n".join([r["text"] for r in results])

        # 4️⃣ Build RAG prompt
        prompt = build_rag_prompt(question, context)

        # 5️⃣ Generate answer
        answer = self.llm.generate(prompt)

        return {
            "answer": answer,
            "sources": results
        }