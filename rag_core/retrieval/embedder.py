import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()


class Embedder:
    """
    Embedding engine using all-mpnet-base-v2
    CPU friendly, high quality semantic model
    """

    def __init__(self):
        token = os.getenv("HF_TOKEN")
        model_name = os.getenv(
            "EMBEDDING_MODEL",
            "sentence-transformers/all-MiniLM-L6-v2",
        )

        self.model = SentenceTransformer(
            model_name,
            token=token
        )

    # --------------------------------------------

    def embed_chunks(self, chunks):
        """
        Receive list of chunks:
        [
          { "text": "...", "page_number": 1 },
          ...
        ]

        Return same list with embeddings attached
        """
        texts = [c["text"] for c in chunks]

        vectors = self.model.encode(
            texts,
            show_progress_bar=True
        )

        for i, vec in enumerate(vectors):
            chunks[i]["embedding"] = vec

        return chunks

    # --------------------------------------------

    def embed_text(self, text: str):
        """
        Embed single query text for retrieval
        """
        vector = self.model.encode([text])
        return vector[0]
  