# NGÀY 1: Cài đặt môi trường & REST API cơ bản với Ollama

- **Mục tiêu:** Thiết lập dự án, cài đặt Ollama và tạo endpoint API đầu tiên để giao tiếp trực tiếp với LLM.
- **Nhiệm vụ:**
  - Khởi tạo dự án Python, môi trường ảo.
  - Cài đặt `FastAPI`, `uvicorn`, `httpx`.
  - Cài đặt Ollama trên máy chủ/máy phát triển.
  - Kéo một mô hình LLM cơ bản (ví dụ: `ollama pull llama3`).
  - Xây dựng file `main.py` với FastAPI.
  - Tạo endpoint `POST /chat/ollama` nhận `{ "message": "string" }` và gửi request đến Ollama, trả về phản hồi.
  - Kiểm tra API bằng `curl` hoặc Swagger UI (FastAPI tự động tạo).
- **Kết quả mong đợi:** Một API hoạt động, có thể gửi tin nhắn đến Ollama và nhận phản hồi.
- **Ưu tiên:** Cao nhất.