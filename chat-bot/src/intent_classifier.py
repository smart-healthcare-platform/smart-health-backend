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
RULE_BASED_KEYWORDS = [
    # Chào hỏi
    "chào bạn", "xin chào", "hello", "hi", "bạn khỏe không",
    # Giới thiệu
    "bạn là ai", "bạn tên gì", "giới thiệu", "chatbot là gì",
    # Giờ làm việc
    "giờ làm việc", "làm việc khi nào", "hoạt động lúc nào", "có trực 24/7 không",
    # Liên hệ
    "liên hệ", "số điện thoại", "gọi cấp cứu", "hỗ trợ khẩn cấp",
    # Cảm ơn
    "cảm ơn", "thanks", "thank you", "biết ơn",
    # Triệu chứng
    "triệu chứng", "dấu hiệu bệnh tim", "biểu hiện bệnh tim", "bệnh tim có triệu chứng gì",
    # Phòng ngừa
    "phòng ngừa", "ngăn ngừa bệnh tim", "cách phòng bệnh tim", "phòng bệnh tim mạch",
    # Tăng huyết áp
    "tăng huyết áp", "cao huyết áp", "huyết áp cao", "kiểm tra huyết áp",
    # Thuốc
    "thuốc tim mạch", "uống thuốc", "quên uống thuốc", "tác dụng phụ thuốc",
    # Chế độ ăn
    "chế độ ăn", "ăn uống cho người bệnh tim", "thực đơn cho tim mạch", "ăn gì tốt cho tim",
    # Tập thể dục
    "tập thể dục", "vận động", "tập luyện cho tim mạch", "bài tập cho người bệnh tim",
    # Stress
    "stress", "căng thẳng", "giảm stress", "kiểm soát căng thẳng",
    # Hướng dẫn sử dụng
    "hướng dẫn sử dụng", "cách dùng healthsmart", "cách sử dụng nền tảng", "hỗ trợ sử dụng",
    # Đặt lịch khám
    "đặt lịch khám", "đăng ký khám", "lịch khám bệnh", "đặt lịch với bác sĩ",
    # BMI
    "bmi", "chỉ số bmi", "tính bmi", "chỉ số khối cơ thể",
    # Cholesterol
    "cholesterol", "mỡ máu", "kiểm tra cholesterol", "giảm cholesterol",
    # Đường huyết
    "đường huyết", "tiểu đường", "kiểm tra đường huyết", "đường máu cao",
    # Đau đầu, chóng mặt, mệt mỏi
    "đau đầu", "chóng mặt", "hoa mắt", "mệt mỏi"
]

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