
from .utils import normalize_text
from enum import Enum

# --- Intent Definitions ---
class Intent(Enum):
    EMERGENCY = "emergency"
    RULE_BASED = "rule_based"
    LLM = "llm"

# --- Keyword Definitions ---
EMERGENCY_KEYWORDS = [
    "đau tim", "nhói tim", "tim đập nhanh", "đau ngực", "khó thở", "ngất", "hoa mắt", "chóng mặt", "tức ngực",
    "ngưng tim", "ngừng tim", "cấp cứu", "hồi sức tim phổi", "thở gấp", "thở hụt hơi", "khó thở khi nằm"
]
from .rules_engine import RULES
# Tự động đồng bộ tất cả keyword từ RULES
RULE_BASED_KEYWORDS = []
for rule in RULES:
    RULE_BASED_KEYWORDS.extend(rule["keywords"])

# --- Classifier Logic ---
def classify_intent(message: str) -> Intent:
    """
    Classifies the user's intent based on keywords in the message (normalized).
    """
    normalized_message = normalize_text(message)

    # 1. Check for emergency intent (highest priority)
    for keyword in EMERGENCY_KEYWORDS:
        if normalize_text(keyword) in normalized_message:
            return Intent.EMERGENCY

    # 2. Check for rule-based intent
    for keyword in RULE_BASED_KEYWORDS:
        if normalize_text(keyword) in normalized_message:
            return Intent.RULE_BASED

    # 3. Default to LLM if no other intent is matched
    return Intent.LLM