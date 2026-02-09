# Optional config file, can store constants like upload folder, FAISS path, etc.
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploaded_docs")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)