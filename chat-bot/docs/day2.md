# NGÀY 2: Xây dựng Rules Engine & Intent Classifier cơ bản

- **Mục tiêu:** Tích hợp Rules Engine để xử lý các câu hỏi đơn giản và một bộ phân loại ý định cơ bản để định tuyến.
- **Nhiệm vụ:**
  - Xây dựng module `rules_engine.py` chứa một dictionary hoặc cấu trúc `if-elif-else` đơn giản cho các câu hỏi thường gặp (ví dụ: "Chào bạn", "Giờ làm việc", "Liên hệ").
  - Xây dựng module `intent_classifier.py` với logic keyword-based để phát hiện:
    - Các câu hỏi Rules Engine.
    - Các câu hỏi khẩn cấp (ví dụ: "đau ngực", "khó thở", "ngất").
    - Các câu hỏi thông thường (mặc định gửi đến LLM).
  - Cập nhật endpoint `POST /chat` chính:
    - Nhận `message`.
    - Sử dụng Intent Classifier để định tuyến.
    - Nếu khẩn cấp: Trả về cảnh báo.
    - Nếu Rules Engine: Trả về câu trả lời từ Rules Engine.
    - Nếu LLM: Gửi đến Ollama (tạm thời không RAG).
- **Kết quả mong đợi:** Chatbot có thể phân biệt và trả lời các câu hỏi đơn giản, và đưa ra cảnh báo khẩn cấp.
- **Ưu tiên:** Cao.