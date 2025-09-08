# Tuần 3, Ngày 5: Kiểm thử Toàn diện và Đánh giá Tuần

## 🎯 Mục tiêu

- Kiểm thử toàn bộ luồng xử lý đã xây dựng trong tuần.
- Tinh chỉnh và sửa lỗi.
- Đánh giá tiến độ tuần 3 và chuẩn bị cho tuần 4.

## 🛠️ Tasks chi tiết

### 1. Viết Integration Tests Nâng cao
- **File:** `tests/integration/full-flow.test.js`
- **Kịch bản:**
    - **Kịch bản 1 (Rule-based):** Gửi tin nhắn kích hoạt rule khẩn cấp. Kiểm tra response, urgency level, và các action đi kèm.
    - **Kịch bản 2 (RAG-based):** Gửi một câu hỏi y tế phức tạp. Mock `ragService` để trả về ngữ cảnh giả định. Kiểm tra xem prompt gửi đến AI có chứa ngữ cảnh đó không.
    - **Kịch bản 3 (AI Fallback):** Gửi một câu hỏi thông thường. Kiểm tra xem hệ thống có fallback về AI không và RAG không được gọi.

### 2. Tinh chỉnh Prompt Engineering
- **File:** `src/services/chatService.js`
- **Nhiệm vụ:**
    - Dựa trên kết quả test, tinh chỉnh lại cấu trúc của prompt gửi đến Ollama.
    - Thử nghiệm các mẫu prompt khác nhau để AI đưa ra câu trả lời vừa chính xác (dựa vào RAG) vừa tự nhiên.
    - Ví dụ prompt: `"Dựa vào thông tin y tế sau: [ngữ cảnh từ RAG]. Hãy trả lời câu hỏi của người dùng một cách thân thiện và chuyên nghiệp: [câu hỏi của người dùng]"`

### 3. Manual End-to-End Testing
- **Công cụ:** Postman hoặc `curl`.
- **Nhiệm vụ:**
    - Khởi động toàn bộ hệ thống bằng `docker-compose up`.
    - Thực hiện lại các kịch bản test ở mục 1 bằng tay để kiểm tra trực quan kết quả.
    - Ghi nhận lại bất kỳ lỗi hoặc hành vi không mong muốn nào.

### 4. Đánh giá Tuần và Chuẩn bị Tuần 4
- **Hoạt động:** Team meeting (hoặc tự đánh giá).
- **Nội dung:**
    - Rà soát lại tất cả các mục tiêu của Tuần 3, đảm bảo chúng đã hoàn thành.
    - Ghi nhận các vấn đề kỹ thuật còn tồn đọng để giải quyết vào tuần sau.
    - Đọc trước kế hoạch của Tuần 4 để chuẩn bị.

## ✅ Success Criteria
- [ ] Tất cả các bài integration test mới đều pass.
- [ ] Prompt cho AI được tối ưu hóa và cho ra kết quả tốt hơn.
- [ ] Hệ thống chạy ổn định khi test E2E bằng tay.
- [ ] Hoàn thành checklist công việc của Tuần 3.
- [ ] Sẵn sàng để bắt đầu các nhiệm vụ của Tuần 4.