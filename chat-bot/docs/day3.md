# NGÀY 3: Chuẩn bị dữ liệu và Thiết lập RAG - Data Ingestion

- **Mục tiêu:** Chuẩn bị cơ sở kiến thức y khoa và xây dựng quy trình nạp dữ liệu vào Vector Database.
- **Nhiệm vụ:**
  - Thu thập một số tài liệu y khoa mẫu về tim mạch (ví dụ: PDF, TXT) và đặt vào thư mục `knowledge_base/`.
  - Cài đặt `LangChain` (hoặc `LlamaIndex`), `chromadb`, `sentence-transformers`.
  - Xây dựng module `rag_pipeline.py`:
    - Chức năng `load_documents()`: Tải tài liệu từ thư mục.
    - Chức năng `split_documents()`: Chia tài liệu thành các đoạn nhỏ (chunks).
    - Chức năng `create_embeddings()`: Sử dụng `SentenceTransformer` (hoặc Ollama embeddings nếu có) để tạo vector nhúng.
    - Chức năng `store_embeddings()`: Lưu trữ các chunk và embeddings vào ChromaDB.
  - Chạy script nạp dữ liệu ban đầu để populate ChromaDB.
- **Kết quả mong đợi:** Cơ sở dữ liệu Vector (ChromaDB) được khởi tạo và chứa các vector nhúng từ tài liệu y khoa của bạn.
- **Ưu tiên:** Cao.