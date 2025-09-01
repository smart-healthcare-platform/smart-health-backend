# Tuần 3, Ngày 4: Xây dựng RAG System (MVP)

## 🎯 Mục tiêu

- Thiết lập và chạy ChromaDB (vector database).
- Xây dựng một script để xử lý và nạp (ingest) tài liệu y tế vào ChromaDB.
- Tích hợp RAG vào luồng xử lý AI của `chatService`.

## 🛠️ Tasks chi tiết

### 1. Cài đặt và Cấu hình ChromaDB
- **Công cụ:** Docker
- **Nhiệm vụ:**
    - Thêm service `chromadb` vào file `docker-compose.yml`.
    - Cấu hình port và volume để lưu trữ dữ liệu của ChromaDB.
    - Chạy `docker-compose up -d chromadb` và đảm bảo service hoạt động.

### 2. Viết Script Ingest Dữ liệu
- **File:** `scripts/ingest-rag-data.js`
- **Thư viện:** `chromadb` (client cho Node.js).
- **Trọng tâm:**
    - Viết hàm để đọc nội dung từ các tệp tin trong thư mục `data/medical-docs/`.
    - Chia nhỏ các tài liệu dài thành các đoạn (chunks) có kích thước hợp lý.
    - Sử dụng một embedding model (có thể gọi qua Ollama) để vector hóa các chunks.
    - Lưu các vector và metadata vào một collection trong ChromaDB.
    - Chạy script để nạp 2-3 tài liệu y tế quan trọng.

### 3. Xây dựng RAG Service
- **File:** `src/services/ragService.js`
- **Trọng tâm:**
    - Viết một hàm `query(question)` nhận đầu vào là một câu hỏi.
    - Hàm này sẽ vector hóa câu hỏi và thực hiện tìm kiếm tương đồng (similarity search) trong ChromaDB.
    - Trả về N (ví dụ: 3) đoạn văn bản có liên quan nhất.

### 4. Cập nhật `chatService.js`
- **File:** `src/services/chatService.js`
- **Trọng tâm:**
    - Trong luồng xử lý AI (sau khi Rule Engine không khớp), gọi `ragService.query(message)` để lấy ngữ cảnh.
    - Xây dựng một prompt mới cho Ollama, bao gồm cả ngữ cảnh từ RAG và câu hỏi của người dùng.
    - Gửi prompt mới này đến Ollama để có câu trả lời chính xác hơn.

## ✅ Success Criteria
- [ ] ChromaDB service đang chạy ổn định.
- [ ] Script ingest dữ liệu hoạt động và đã nạp được tài liệu vào DB.
- [ ] `ragService` có thể truy vấn và trả về kết quả.
- [ ] `chatService` sử dụng thành công RAG để cải thiện câu trả lời của AI.