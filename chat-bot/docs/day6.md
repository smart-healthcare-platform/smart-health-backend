# NGÀY 6: Đánh giá, Tối ưu & Dockerization

- **Mục tiêu:** Kiểm tra lại toàn bộ hệ thống, tối ưu hiệu suất và chuẩn bị cho triển khai.
- **Nhiệm vụ:**
  - **Kiểm thử:**
    - Kiểm tra các trường hợp cạnh của Rules Engine.
    - Kiểm tra chất lượng trả lời của RAG với các câu hỏi khác nhau.
    - Kiểm tra phát hiện khẩn cấp.
    - Kiểm tra tính năng ngữ cảnh.
    - Đảm bảo Disclaimer luôn hiển thị.
  - **Tối ưu:**
    - Tối ưu kích thước chunk, số lượng tài liệu trả về từ RAG.
    - Điều chỉnh prompt cho LLM.
    - Kiểm tra hiệu suất API.
  - **Dockerization:**
    - Tạo `Dockerfile` để đóng gói ứng dụng FastAPI, Ollama (nếu chạy trong cùng container, hoặc hoặc kết nối đến Ollama host riêng).
    - Tạo `docker-compose.yml` để dễ dàng khởi động dịch vụ (FastAPI app, ChromaDB, Ollama nếu cần).
- **Kết quả mong đợi:** Một chatbot MVP ổn định, tối ưu hóa cơ bản và sẵn sàng để triển khai bằng Docker.
- **Ưu tiên:** Cao.