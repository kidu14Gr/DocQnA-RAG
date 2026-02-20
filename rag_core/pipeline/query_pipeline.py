from rag_core.retrieval.embedder import Embedder
from rag_core.retrieval.vector_store import VectorStore
from rag_core.generation.llm_model import LLMModel
from rag_core.generation.prompt_templates import build_doc_prompt, build_general_prompt
from rag_core.pipeline.memory import ConversationBufferMemory

class QueryPipeline:
    """
    Question → embed → retrieve → prompt → LLM answer
    """

    def __init__(self):
        self.embedder = Embedder()
        self.store = VectorStore()
        self.llm = LLMModel()
        self.memory = ConversationBufferMemory(memory_key="history", return_messages=False)

    def query(self, question: str, top_k: int = 4):
        # 0️⃣ Load conversation history + classify intent
        history = self.memory.load_memory_variables({}).get("history", "")
        intent = self.llm.classify_intent(question, history)

        # If no document has been ingested and question is document-related
        if intent == "DOCUMENT" and (self.store.index is None or not self.store.metadata):
            answer = "Please upload your document first."
            self.memory.save_context({"input": question}, {"output": answer})
            return {
                "answer": answer,
                "sources": []
            }

        # General questions should bypass retrieval
        if intent == "GENERAL":
            prompt = build_general_prompt(question, history)
            answer = self.llm.generate_general(prompt)
            self.memory.save_context({"input": question}, {"output": answer})
            return {
                "answer": answer,
                "sources": []
            }

        # 1️⃣ Embed the question
        question_vector = self.embedder.embed_text(question)

        # 2️⃣ Retrieve relevant chunks
        results = self.store.search(question_vector, top_k=top_k)

        # 3️⃣ Aggregate context
        context = "\n\n".join([r["text"] for r in results])

        # 4️⃣ Build RAG prompt
        prompt = build_doc_prompt(question, context, history)

        # 5️⃣ Generate answer
        answer = self.llm.generate(prompt)

        # 6️⃣ Save to memory
        self.memory.save_context({"input": question}, {"output": answer})

        return {
            "answer": answer,
            "sources": results
        }
