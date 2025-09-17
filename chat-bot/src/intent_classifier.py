from enum import Enum

# --- Intent Definitions ---
class Intent(Enum):
    EMERGENCY = "emergency"
    RULE_BASED = "rule_based"
    LLM = "llm"

# --- Keyword Definitions ---
EMERGENCY_KEYWORDS = ["đau tim", "nhói tim", "tim đập nhanh", "đau ngực", "khó thở", "ngất", "hoa mắt", "chóng mặt", "tức ngực"]
RULE_BASED_KEYWORDS = ["chào", "bạn là ai", "giờ làm việc", "liên hệ", "cảm ơn", "triệu chứng", "phòng ngừa", "tăng huyết áp"]

# --- Classifier Logic ---
def classify_intent(message: str) -> Intent:
    """
    Classifies the user's intent based on keywords in the message.
    """
    normalized_message = message.lower().strip()
    
    # 1. Check for emergency intent (highest priority)
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in normalized_message:
            return Intent.EMERGENCY
            
    # 2. Check for rule-based intent
    for keyword in RULE_BASED_KEYWORDS:
        if keyword in normalized_message:
            return Intent.RULE_BASED
            
    # 3. Default to LLM if no other intent is matched
    return Intent.LLM