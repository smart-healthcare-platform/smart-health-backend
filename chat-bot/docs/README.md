## TÀI LIỆU DỰ ÁN: CHATBOT SERVICE HỖ TRỢ BỆNH NHÂN TIM MẠCH

### 1. GIỚI THIỆU

Dự án này nhằm mục đích xây dựng một Chatbot Service thông minh và đáng tin cậy, hỗ trợ bệnh nhân tim mạch trong việc tìm kiếm thông tin, giải đáp thắc mắc cơ bản và cung cấp hướng dẫn y tế sơ bộ. Service sẽ tích hợp công nghệ Trí tuệ Nhân tạo (AI) tiên tiến với hệ thống luật định (Rules Engine) để đảm bảo độ chính xác và an toàn thông tin, đặc biệt trong lĩnh vực y tế nhạy cảm.

**Mục tiêu chính:**

- Cung cấp thông tin y khoa chính xác và dễ hiểu về bệnh tim mạch.
- Giải đáp các câu hỏi thường gặp một cách nhanh chóng và nhất quán.
- Giảm tải cho nhân viên y tế bằng cách tự động hóa các tương tác cơ bản.
- Nâng cao trải nghiệm và sự tự tin của bệnh nhân trong việc quản lý sức khỏe tim mạch.

### 2. CÁC TÍNH NĂNG CHÍNH

1.  **API RESTful mạnh mẽ:** Cung cấp các endpoint để frontend tương tác với chatbot một cách liền mạch.
2.  **Tích hợp mô hình ngôn ngữ lớn (LLM) qua Ollama:** Sử dụng các mô hình mở (như Llama 3, Mistral) để xử lý các câu hỏi phức tạp và tạo ra phản hồi tự nhiên.
3.  **Hệ thống Rules Engine:** Xử lý nhanh chóng và chính xác các câu hỏi đơn giản, thường gặp (FAQs) mà không cần đến LLM, giúp tối ưu hiệu suất và chi phí.
4.  **Hệ thống Retrieval-Augmented Generation (RAG):** Cho phép LLM truy cập và tổng hợp thông tin từ cơ sở dữ liệu tài liệu y khoa chuyên sâu, đảm bảo câu trả lời chính xác, cập nhật và có căn cứ.
5.  **Bộ phân loại ý định (Intent Classifier/Router):** Tự động định tuyến câu hỏi của người dùng đến Rules Engine, RAG/LLM hoặc kích hoạt cảnh báo khẩn cấp.
6.  **Phát hiện và cảnh báo khẩn cấp:** Nhận diện các triệu chứng nguy hiểm và đưa ra lời khuyên khẩn cấp cho người dùng.
7.  **Quản lý ngữ cảnh (Context Management):** Duy trì luồng hội thoại tự nhiên bằng cách ghi nhớ các thông tin đã trao đổi trước đó.
8.  **Tích hợp tuyên bố miễn trừ trách nhiệm y tế (Medical Disclaimer):** Đảm bảo người dùng hiểu rõ rằng thông tin chỉ mang tính tham khảo và không thay thế cho lời khuyên của bác sĩ.

### 3. KIẾN TRÚC HỆ THỐNG

Dịch vụ Chatbot sẽ được xây dựng trên kiến trúc Microservices cơ bản, với một API Gateway làm trung tâm điều phối.

#### 3.1. Sơ đồ Kiến trúc Tổng quan

```
+-------------------+       +--------------------+       +-----------------------------+
|    User (Patient) | ----> | Frontend Interface | ----> |       REST API Gateway      |
|                   |       | (Web/Mobile App)   |       | (FastAPI, Python)           |
+-------------------+       +--------------------+       +-----------------------------+
                                                                  |
                                                                  v
                                                 +-----------------------------------+
                                                 |      Intent Classifier / Router   |
                                                 | (Keyword-based / Simple ML Model) |
                                                 +-----------------------------------+
                                                          |              |
                                                          |              |
                       +----------------------------------+              +----------------------------------+
                       | (Simple/FAQ Questions)                          | (Complex/Knowledge-based Questions)
                       v                                                 v
             +---------------------+                             +---------------------+
             |    Rules Engine     |                             |      RAG System     |
             | (Python Logic/Dict) |                             |                     |
             +---------------------+                             |  +----------------+ |
                       |                                         |  | Vector Database| |
                       |                                         |  | (ChromaDB)     | |
                       |                                         |  +----------------+ |
                       |                                         |         ^           |
                       |                                         |         |           |
                       |                                         |  +----------------+ |
                       |                                         |  | Embedding Model| |
                       |                                         |  +----------------+ |
                       |                                         |         ^           |
                       |                                         |         |           |
                       |                                         |  +----------------+ |
                       |                                         |  | Knowledge Base | |
                       |                                         |  | (Medical Docs) | |
                       |                                         |  +----------------+ |
                       |                                         |         |           |
                       |                                         +---------------------+
                       |                                                 |
                       |                                                 v
                       +-------------------------------------------------+
                                                 |
                                                 v
                                        +-------------------+
                                        |    Ollama LLM     |
                                        | (Llama 3 / Mistral)|
                                        +-------------------+
                                                 |
                                                 v
                                        +-------------------+
                                        | Context Manager   |
                                        | (In-memory/Redis) |
                                        +-------------------+
                                                 |
                                                 v
                                        +-------------------+
                                        | Medical Disclaimer|
                                        |   Integration     |
                                        +-------------------+
                                                 |
                                                 v
                                        +-----------------------------+
                                        |       REST API Gateway      |
                                        | (Response to Frontend)      |
                                        +-----------------------------+
```

#### 3.2. Mô tả các thành phần

- **Frontend Interface:** Giao diện người dùng (web hoặc mobile) nơi bệnh nhân tương tác với chatbot. (Ngoài phạm vi tài liệu này).
- **REST API Gateway (Python - FastAPI):**
  - Điểm tiếp nhận mọi yêu cầu từ frontend.
  - Điều phối luồng xử lý thông qua Intent Classifier.
  - Tổng hợp các phản hồi và thêm Medical Disclaimer trước khi gửi về frontend.
- **Intent Classifier / Router:**
  - Phân tích ý định của người dùng dựa trên từ khóa, cấu trúc câu hoặc một mô hình phân loại đơn giản.
  - Định tuyến yêu cầu đến Rules Engine, RAG System hoặc kích hoạt cảnh báo khẩn cấp.
- **Rules Engine (Python):**
  - Chứa các quy tắc được định nghĩa trước để xử lý các câu hỏi FAQ.
  - Trả về câu trả lời đã được soạn sẵn hoặc thực hiện các hành động cụ thể.
- **RAG System (Python - LangChain/LlamaIndex):**
  - **Knowledge Base:** Tập hợp các tài liệu y khoa đáng tin cậy (PDF, DOCX, TXT) về bệnh tim mạch.
  - **Embedding Model:** Chuyển đổi văn bản thành vector số để tìm kiếm ngữ nghĩa. Có thể dùng mô hình từ Hugging Face hoặc qua API của Ollama.
  - **Vector Database (ChromaDB):** Lưu trữ các vector nhúng của tài liệu và cho phép tìm kiếm nhanh chóng các đoạn văn bản liên quan đến câu hỏi của người dùng.
  - **Retrieval Logic:** Truy vấn Vector Database để tìm các đoạn văn bản phù hợp nhất với câu hỏi.
- **Ollama LLM:**
  - Mô hình ngôn ngữ lớn chạy cục bộ (ví dụ: `llama3`, `mistral`).
  - Nhận câu hỏi của người dùng và các đoạn tài liệu liên quan (từ RAG) để tạo ra câu trả lời chi tiết và chính xác.
- **Context Manager (Python):**
  - Lưu trữ lịch sử hội thoại gần nhất để duy trì ngữ cảnh cho các câu hỏi tiếp theo. Ban đầu có thể dùng in-memory, sau đó nâng cấp lên Redis hoặc cơ sở dữ liệu.
- **Medical Disclaimer Integration:**
  - Tự động thêm một tuyên bố miễn trừ trách nhiệm rõ ràng vào cuối mỗi câu trả lời liên quan đến y tế.

### 4. CÔNG NGHỆ SỬ DỤNG

- **Ngôn ngữ lập trình:** Python 3.9+
- **Web Framework:** FastAPI (cho REST API)
- **LLM Runtime:** Ollama
- **LLM Orchestration/RAG:** LangChain hoặc LlamaIndex
- **Vector Database:** ChromaDB (nhẹ, dễ tích hợp, Python-native)
- **Embedding Models:** Sentence-Transformers (hoặc mô hình tương ứng từ Ollama)
- **HTTP Client:** `httpx` (cho các request không đồng bộ)
- **Deployment:** Docker (để đóng gói ứng dụng)
- **Quản lý phụ thuộc:** `pip` / `Poetry`

### 5. KẾ HOẠCH TRIỂN KHAI (7 NGÀY)

Kế hoạch này tập trung vào việc xây dựng một MVP (Minimum Viable Product) hoạt động được trong 7 ngày. Dưới đây là tổng quan về các mục tiêu cho mỗi ngày. Để xem chi tiết nhiệm vụ, mã nguồn ví dụ và hướng dẫn cụ thể, vui lòng tham khảo các tài liệu sau:

- **[Ngày 1: Cài đặt môi trường & REST API cơ bản với Ollama](day1.md)**
- **[Ngày 2: Xây dựng Rules Engine & Intent Classifier cơ bản](day2.md)**
- **[Ngày 3: Chuẩn bị dữ liệu và Thiết lập RAG - Data Ingestion](day3.md)**
- **[Ngày 4: Triển khai RAG - Retrieval và LLM Integration](day4.md)**
- **[Ngày 5: Quản lý ngữ cảnh & Tuyên bố miễn trừ trách nhiệm](day5.md)**
- **[Ngày 6: Đánh giá, Tối ưu & Dockerization](day6.md)**
- **[Ngày 7: Tài liệu API, Hướng dẫn sử dụng & Báo cáo](day7.md)**

---

### 6. CÁC CÂN NHẮC QUAN TRỌNG & RỦI RO

- **Chất lượng Knowledge Base:** Độ chính xác và đáng tin cậy của RAG phụ thuộc hoàn toàn vào chất lượng của tài liệu y khoa bạn cung cấp. Hãy đảm bảo nguồn tài liệu được kiểm duyệt kỹ lưỡng.
- **Hallucination của LLM:** Mặc dù RAG giúp giảm thiểu, LLM vẫn có thể "bịa đặt" thông tin. Tuyên bố miễn trừ trách nhiệm là bắt buộc. Cần có cơ chế giám sát và cập nhật thường xuyên.
- **Bảo mật dữ liệu:** Dữ liệu y tế là nhạy cảm. Đảm bảo không thu thập hoặc xử lý thông tin nhận dạng cá nhân (PII) không cần thiết. Nếu có, phải tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu (ví dụ: HIPAA, GDPR).
- **Hiệu suất:** Ollama chạy cục bộ cần tài nguyên phần cứng (CPU/GPU) đáng kể. Việc tối ưu hóa mô hình và cấu hình Ollama là quan trọng.
- **Timeline 7 ngày:** Rất ngắn. Kế hoạch này tập trung vào MVP. Các tính năng nâng cao (Persistent Context, Advanced Intent Classification) sẽ là các giai đoạn tiếp theo.

### 7. Tuyên Bố Miễn Trừ Trách Nhiệm Y Tế

**QUAN TRỌNG:** Thông tin được cung cấp bởi chatbot này chỉ mang tính chất tham khảo chung và giáo dục. Nó không nhằm mục đích chẩn đoán, điều trị, chữa khỏi, hoặc ngăn ngừa bất kỳ bệnh tật hoặc tình trạng y tế nào, và không thể thay thế cho lời khuyên, chẩn đoán, hoặc điều trị y tế chuyên nghiệp từ bác sĩ hoặc nhà cung cấp dịch vụ chăm sóc sức khỏe có trình độ. Luôn tìm kiếm lời khuyên từ bác sĩ hoặc chuyên gia y tế đủ điều kiện về bất kỳ câu hỏi nào bạn có liên quan đến tình trạng sức khỏe của mình. Đừng bao giờ bỏ qua lời khuyên y tế chuyên nghiệp hoặc trì hoãn việc tìm kiếm nó vì thông tin bạn đã đọc hoặc nhận được từ chatbot này.

---

Hy vọng tài liệu này cung cấp một cái nhìn tổng quan đầy đủ và một lộ trình rõ ràng để bạn có thể bắt đầu triển khai Chatbot Service hỗ trợ bệnh nhân tim mạch của mình. Chúc bạn thành công!
