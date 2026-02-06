# AI Document RAG Chatbot

Professional RAG system:
- Multi document Q&A
- Citations
- Chat history
- Free & open source stack


| File                    | Purpose                                                    |
| ----------------------- | ----------------------------------------------------------     |
| `pdf_loader.py`           | Load PDF files and extract text                            |
| `docx_loader.py`          | Load DOCX files and extract text                           |
| `utils.py` (ingestion)  | Chunking, cleaning, preprocessing text                     |
| `embedder.py`           | Convert text chunks → embeddings using `all-mpnet-base-v2` |
| `vector_store.py`       | Store embeddings in FAISS, query similarity                |
| `utils.py` (retrieval)  | Search helpers, filtering by metadata (page/file)          |
| `llm_model.py`          | Load CPU-friendly LLM, generate answers from context       |
| `prompt_templates.py`   | Store prompts for Q&A, summarization, citations            |
| `utils.py` (generation) | Format answers, attach page/file citations                 |
