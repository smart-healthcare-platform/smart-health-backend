# NGÀY 4: Triển khai RAG - Retrieval và LLM Integration

- **Mục tiêu:** Hoàn thiện luồng RAG, cho phép LLM sử dụng tài liệu tìm được để trả lời.
- **Nhiệm vụ:**
  - Trong `rag_pipeline.py`, thêm chức năng `retrieve_documents(query)`: Truy vấn ChromaDB để tìm các đoạn tài liệu liên quan nhất đến câu hỏi.
  - Cập nhật logic trong endpoint `POST /chat`:
    - Khi ý định là "LLM", trước tiên gọi `retrieve_documents()` với câu hỏi của người dùng.
    - Xây dựng một prompt mới cho Ollama, bao gồm câu hỏi của người dùng và các đoạn tài liệu đã tìm được (context).
    - Gửi prompt này đến Ollama.
  - Tinh chỉnh prompt để hướng dẫn LLM trả lời dựa trên context và chỉ rõ nếu thông tin không có trong context.
- **Kết quả mong đợi:** Chatbot có thể trả lời các câu hỏi phức tạp bằng cách tham khảo tài liệu y khoa.
- **Ưu tiên:** Cao.