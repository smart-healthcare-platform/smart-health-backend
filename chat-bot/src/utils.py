import unicodedata
import re

def normalize_text(text: str) -> str:
    """
    Chuẩn hóa text: lower, strip, unicode NFC, loại bỏ dấu câu.
    """
    text = text.lower().strip()
    text = unicodedata.normalize('NFC', text)
    # Loại bỏ dấu câu và ký tự đặc biệt
    text = re.sub(r'[\.,;:!?"\'\-–—()\[\]{}<>…]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text
