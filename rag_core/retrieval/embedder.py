from sentence_transformers import SentenceTransformer


class Embedder:
    """
    Embedding engine using all-mpnet-base-v2
    CPU friendly, high quality semantic model
    """

    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

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