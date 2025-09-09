# A simple dictionary-based rules engine for common questions.

RULES = {
    "chào bạn": "Chào bạn, tôi là trợ lý sức khỏe thông minh. Tôi có thể giúp gì cho bạn?",
    "bạn là ai": "Tôi là một chatbot được thiết kế để cung cấp thông tin về sức khỏe tim mạch.",
    "giờ làm việc": "Tôi hoạt động 24/7. Tuy nhiên, với các trường hợp khẩn cấp, bạn nên liên hệ trực tiếp với cơ sở y tế.",
    "liên hệ": "Để được hỗ trợ khẩn cấp, vui lòng gọi 115. Để được tư vấn chuyên sâu, hãy đặt lịch với bác sĩ của bạn.",
    "cảm ơn": "Rất vui được giúp bạn! Nếu có câu hỏi khác, đừng ngần ngại hỏi nhé."
}

def get_rule_based_response(message: str) -> str | None:
    """
    Checks if the message matches any predefined rule (case-insensitive).
    Returns the corresponding response or None if no match is found.
    """
    # Normalize the message for simple matching
    normalized_message = message.lower().strip()
    
    for keyword, response in RULES.items():
        if keyword in normalized_message:
            return response
            
    return None