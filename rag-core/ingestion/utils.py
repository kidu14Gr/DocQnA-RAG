def chunk_text(pages, chunk_size=500, overlap=100):
    """
    Split text into chunks while keeping page info for citations
    """
    chunks = []

    for page in pages:
        words = page["text"].split()
        start = 0

        while start < len(words):
            end = min(start + chunk_size, len(words))

            chunk_text_content = " ".join(words[start:end])

            chunks.append({
                "text": chunk_text_content,
                "page_number": page["page_number"]
            })

            start += chunk_size - overlap

    return chunks