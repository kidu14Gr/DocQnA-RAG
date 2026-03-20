from rag_core.retrieval.embedder import Embedder
from rag_core.retrieval.vector_store import VectorStore
from rag_core.generation.llm_model import LLMModel
from rag_core.generation.prompt_templates import build_doc_prompt, build_general_prompt
from rag_core.pipeline.memory import ConversationBufferMemory


class QueryPipeline:
    """
    Question → embed → retrieve → prompt → LLM answer.
    Accepts optional embedder, store, llm for per-user isolation.
    If history is passed to query(), it is used instead of in-memory buffer (DB-backed).
    """

    def __init__(self, embedder=None, store=None, llm=None, memory=None):
        self.embedder = embedder if embedder is not None else Embedder()
        self.store = store if store is not None else VectorStore()
        self.llm = llm if llm is not None else LLMModel()
        self.memory = memory if memory is not None else ConversationBufferMemory(memory_key="history", return_messages=False)

    def query(self, question: str, top_k: int = 4, history: str | None = None):
        # 0️⃣ Conversation history: from DB (history) or in-memory buffer
        if history is not None:
            history_str = history
        else:
            history_str = self.memory.load_memory_variables({}).get("history", "")
        intent = self.llm.classify_intent(question, history_str)
        lowered = question.lower()
        doc_keywords = (
            "document", "doc", "docx", "pdf", "file", "uploaded", "report",
            "paper", "manual", "contract", "resume", "cv", "curriculum vitae",
            "in the document", "in the file", "according to the document",
            "from the document", "based on the document", "page", "section",
            "chapter", "table", "figure",
        )
        asks_about_document = any(keyword in lowered for keyword in doc_keywords)
        has_uploaded_doc = not (self.store.index is None or not self.store.metadata)
        explicit_general_cues = (
            "in general",
            "generally",
            "not from the document",
            "ignore the document",
            "outside the document",
        )
        asks_explicit_general = any(cue in lowered for cue in explicit_general_cues)

        # If no document has been ingested and question is document-related
        if (intent == "DOCUMENT" or asks_about_document) and not has_uploaded_doc:
            answer = (
                "Please provide the CV you'd like me to refer to, and I can give you a more specific "
                "list of skills mentioned in it."
                if ("cv" in lowered or "resume" in lowered or "curriculum vitae" in lowered)
                else "Please upload a document first, then I can answer based on its contents."
            )
            if history is None:
                self.memory.save_context({"input": question}, {"output": answer})
            return {
                "answer": answer,
                "sources": []
            }

        # If a document exists, default to document-grounded answers for continuity.
        # Only bypass retrieval when user explicitly asks for a general response.
        if intent == "GENERAL" and (not has_uploaded_doc or asks_explicit_general):
            prompt = build_general_prompt(question, history_str)
            answer = self.llm.generate_general(prompt)
            if history is None:
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
        prompt = build_doc_prompt(question, context, history_str)

        # 5️⃣ Generate answer
        answer = self.llm.generate(prompt)

        # 6️⃣ Save to memory only when not using DB-backed history
        if history is None:
            self.memory.save_context({"input": question}, {"output": answer})

        return {
            "answer": answer,
            "sources": results
        }
