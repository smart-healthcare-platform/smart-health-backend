# NGÀY 5: Quản lý ngữ cảnh & Tuyên bố miễn trừ trách nhiệm

- **Mục tiêu:** Cải thiện trải nghiệm hội thoại và đảm bảo tuân thủ các quy định y tế.
- **Nhiệm vụ:**
  - **Quản lý ngữ cảnh:**
    - Triển khai một lớp `ConversationMemory` đơn giản (có thể dùng `dict` trong bộ nhớ cho MVP) để lưu trữ `(user_message, bot_response)` của N lượt hội thoại gần nhất.
    - Mỗi khi có tin nhắn mới, lấy lịch sử hội thoại và thêm vào prompt gửi đến LLM.
  - **Tuyên bố miễn trừ trách nhiệm:**
    - Tạo một `MEDICAL_DISCLAIMER` dạng string.
    - Cập nhật logic xử lý phản hồi trong `main.py` để tự động nối `MEDICAL_DISCLAIMER` vào cuối mọi câu trả lời được tạo bởi LLM hoặc RAG.
  - Kiểm tra end-to-end các luồng hội thoại.
- **Kết quả mong đợi:** Chatbot có thể duy trì ngữ cảnh cơ bản và luôn hiển thị tuyên bố miễn trừ trách nhiệm.
- **Ưu tiên:** Trung bình - Cao (đặc biệt là Disclaimer).