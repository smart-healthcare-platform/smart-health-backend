# Lộ trình Phát triển Chatbot Service (Tối ưu hóa trong 4 Tuần)

## 1. Tổng quan

Lộ trình này được tối ưu hóa để hoàn thành các tính năng cốt lõi của Chatbot Service trong vòng 4 tuần, nhằm đáp ứng deadline. Kế hoạch tập trung vào việc xây dựng một sản phẩm khả thi (MVP) với các chức năng quan trọng nhất, tạm gác lại các tính năng nâng cao để phát triển sau.

**Hiện trạng:** Đã hoàn thành Tuần 2.
**Mục tiêu:** Hoàn thành MVP trong 2 tuần tới (Tuần 3 và Tuần 4).

---

## **Giai đoạn 1: Nền tảng & Core Service (Đã hoàn thành)**

### **Tuần 1-2: Thiết lập Infrastructure & Core Service**
- **[x]** Thiết lập Docker environment với các service cơ bản (MySQL, Redis, Ollama).
- **[x]** Xây dựng Chatbot Service Core với các API endpoints cơ bản (`/chat`, `/history`, `/health`).
- **[x]** Tích hợp ban đầu với Ollama AI Model.
- **[x]** Triển khai cơ chế lưu trữ session và context với Redis.
- **[x]** Bắt đầu phát triển Rule Engine.

---

## **Giai đoạn 2: Hoàn thiện MVP (2 Tuần Tới)**

### **Tuần 3: Tích hợp Cốt lõi - RAG, AI & Hoàn thiện Rule Engine**

#### **Mục tiêu tuần:**
- Hệ thống có khả năng đưa ra thông tin y tế chính xác từ nguồn tài liệu tin cậy.
- Hoàn thiện luồng xử lý logic cơ bản.

#### **Các nhiệm vụ chính:**
- **[ ] Core Service:**
    - Hoàn thiện và kiểm thử các API endpoints (`/chat`, `/history`, `/health`, `/session`).
    - Tích hợp chặt chẽ logic điều phối giữa Rule Engine, RAG và AI.
- **[ ] Rule Engine:**
    - Hoàn thiện implementation của Rule Engine.
    - Định nghĩa và import các bộ luật y tế cơ bản (ví dụ: nhận biết triệu chứng khẩn cấp, trả lời câu hỏi thường gặp).
- **[ ] RAG System (MVP):**
    - Thiết lập vector database (ưu tiên ChromaDB vì tính đơn giản, dễ cài đặt).
    - Chuẩn bị và vector hóa một bộ tài liệu y tế cốt lõi (5-10 tài liệu quan trọng nhất).
    - Xây dựng API nội bộ để truy xuất thông tin từ RAG.
    - Tích hợp RAG vào luồng xử lý của AI để tăng cường độ chính xác.
- **[ ] Testing:**
    - Viết Unit test cho các service và logic mới.
    - Viết Integration test cho luồng dữ liệu giữa các thành phần.

### **Tuần 4: Tự động hóa, Hoàn thiện & Chuẩn bị Triển khai**

#### **Mục tiêu tuần:**
- Hệ thống có khả năng cảnh báo trong tình huống khẩn cấp.
- Ứng dụng được đóng gói, sẵn sàng để triển khai.

#### **Các nhiệm vụ chính:**
- **[ ] n8n Automation (MVP):**
    - Thiết lập một workflow n8n đơn giản cho cảnh báo khẩn cấp (ví dụ: gọi một webhook khi có từ khóa nguy hiểm).
    - Tích hợp việc gọi webhook này từ Chatbot Service khi Rule Engine hoặc AI phát hiện tình huống khẩn cấp.
- **[ ] AI & Prompt Engineering:**
    - Tinh chỉnh và tối ưu hóa các prompt để AI có thể tận dụng hiệu quả thông tin từ RAG.
    - Xây dựng cơ chế fallback khi AI không phản hồi hoặc trả về kết quả không mong muốn.
- **[ ] Bảo mật Cơ bản:**
    - Rà soát và đảm bảo các biến môi trường, secrets, API keys được quản lý an toàn.
    - Cấu hình CORS và các security headers cơ bản.
- **[ ] Hoàn thiện & Đóng gói:**
    - Thực hiện kiểm thử toàn bộ luồng (End-to-End testing) cho các kịch bản quan trọng.
    - Cập nhật tài liệu `README.md` và `deployment.md` với hướng dẫn triển khai phiên bản MVP.
    - Tối ưu hóa Dockerfile và `docker-compose.yml` để sẵn sàng triển khai.

---

## **Giai đoạn 3: Post-MVP & Cải tiến Liên tục (Ongoing)**

Các tính năng này đã được tạm gác lại để tập trung cho MVP và sẽ được phát triển trong các giai đoạn tiếp theo:

- **[ ] Tinh chỉnh AI Nâng cao:**
    - Fine-tune mô hình ngôn ngữ với dữ liệu y tế chuyên sâu.
- **[ ] Mở rộng Tính năng:**
    - Tích hợp đa ngôn ngữ.
    - Tích hợp Voice-to-Text và Text-to-Speech.
    - Xây dựng hệ thống đánh giá và phản hồi từ người dùng.
- **[ ] Bảo mật và Tuân thủ Nâng cao:**
    - Triển khai mã hóa dữ liệu y tế (data-at-rest, data-in-transit).
    - Đảm bảo tuân thủ đầy đủ các quy định (HIPAA, GDPR).
    - Triển khai audit logging chi tiết.
- **[ ] Triển khai Production Quy mô lớn:**
    - Cấu hình load balancing và auto-scaling.
    - Thiết lập hệ thống monitoring và alerting hoàn chỉnh (Prometheus, Grafana).
    - Xây dựng kế hoạch backup và disaster recovery.