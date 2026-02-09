from pathlib import Path
from pypdf import PdfReader
from .utils import chunk_text  # import chunking function

def load_pdf(file_path: str):
    """
    Load a PDF and return a list of pages with text.
    Each page is a dict with 'page_number' and 'text'
    """
    pdf_path = Path(file_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"{file_path} not found")

    reader = PdfReader(str(pdf_path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            pages.append({"page_number": i+1, "text": text})
    return pages


def load_and_chunk_pdf(file_path: str, chunk_size: int = 500, overlap: int = 100):
    """
    Full pipeline for a PDF:
    1. Load pages
    2. Chunk text with page info
    Returns list of chunks ready for embeddings
    """
    pages = load_pdf(file_path)
    chunks = chunk_text(pages, chunk_size=chunk_size, overlap=overlap)
    return chunks