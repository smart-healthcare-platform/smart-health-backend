# Các Thành phần Chính của Chatbot Service

## 1. Chatbot Service Core

### Mô tả
Chatbot Service Core là thành phần trung tâm điều phối toàn bộ hoạt động của hệ thống chatbot. Nó nhận yêu cầu từ người dùng, xử lý và trả lời thông qua các thành phần khác.

### Chức năng chính
- Nhận và xử lý các yêu cầu từ người dùng qua API Gateway
- Phân tích yêu cầu để xác định mức độ phức tạp
- Điều phối luồng xử lý giữa các thành phần khác nhau
- Quản lý ngữ cảnh của cuộc trò chuyện
- Trả lời người dùng qua API Gateway
- Lưu trữ tin nhắn vào Cache/Session Store và Database

### Công nghệ sử dụng
- Ngôn ngữ lập trình: Node.js với Express hoặc Python với FastAPI
- Containerization: Docker
- Logging: Winston (Node.js) hoặc Loguru (Python)

### API Endpoints
- `POST /chat`: Nhận tin nhắn từ người dùng
- `GET /history/:userId`: Lấy lịch sử trò chuyện của người dùng
- `DELETE /session/:sessionId`: Xóa session của người dùng

### Cách tương tác với các thành phần khác
- Gửi yêu cầu đến Rule Engine cho các câu hỏi đơn giản
- Gửi yêu cầu đến RAG System để truy xuất thông tin
- Gửi yêu cầu đến Ollama AI Model để xử lý ngôn ngữ tự nhiên
- Gửi yêu cầu đến n8n Automation khi cần thông báo khẩn cấp
- Lưu trữ dữ liệu vào Database và Cache/Session Store

## 2. Ollama AI Model

### Mô tả
Ollama AI Model là thành phần chạy mô hình ngôn ngữ mở để xử lý ngôn ngữ tự nhiên và tạo phản hồi tự nhiên cho người dùng.

### Chức năng chính
- Chạy mô hình ngôn ngữ mở để hiểu và tạo phản hồi tự nhiên
- Xử lý các yêu cầu phức tạp cần suy luận và phân tích
- Tích hợp với RAG System để truy xuất thông tin liên quan
- Có thể được public qua tunnel (ngrok/cloudflare) nếu cần

### Công nghệ sử dụng
- Nền tảng: Ollama
- Mô hình: Llama 2, Mistral hoặc các mô hình ngôn ngữ mở khác
- API: Ollama API

### Cách cấu hình
- Chọn mô hình phù hợp (ví dụ: llama2:7b, mistral:7b)
- Cấu hình tài nguyên (RAM, CPU, GPU)
- Cấu hình endpoint API

### Cách tương tác với các thành phần khác
- Nhận yêu cầu từ Chatbot Service Core
- Truy xuất thông tin từ RAG System nếu cần
- Trả kết quả về cho Chatbot Service Core

## 3. Rule Engine

### Mô tả
Rule Engine là thành phần xử lý logic dựa trên tập luật có sẵn, giúp xử lý nhanh các yêu cầu đơn giản mà không cần đến AI model.

### Chức năng chính
- Xử lý các trường hợp thông thường dựa trên tập luật đã có
- Cung cấp phản hồi nhanh cho các câu hỏi đơn giản
- Giảm tải cho AI model bằng cách xử lý các yêu cầu đơn giản
- Dễ dàng cập nhật và mở rộng tập luật

### Công nghệ sử dụng
- Ngôn ngữ: Java với Drools hoặc custom rule engine
- Định dạng luật: JSON hoặc DSL (Domain Specific Language)

### Cách cấu hình
- Định nghĩa tập luật trong file cấu hình
- Cấu hình mức độ ưu tiên của các luật
- Cấu hình điều kiện kích hoạt luật

### Ví dụ về luật
```json
{
  "rules": [
    {
      "id": "rule_001",
      "condition": "message contains 'triệu chứng đau ngực'",
      "action": "respond with 'Đau ngực có thể là dấu hiệu của nhiều vấn đề tim mạch. Bạn nên mô tả thêm về cơn đau như: vị trí, thời gian kéo dài, mức độ đau.'"
    },
    {
      "id": "rule_002",
      "condition": "message contains 'huyết áp' and 'cao'",
      "action": "respond with 'Huyết áp cao là một yếu tố nguy cơ tim mạch. Bạn nên theo dõi huyết áp thường xuyên và tuân thủ chỉ định của bác sĩ.'"
    }
  ]
}
```

### Cách tương tác với các thành phần khác
- Nhận yêu cầu từ Chatbot Service Core
- Trả kết quả về cho Chatbot Service Core

## 4. RAG System (Retrieval-Augmented Generation)

### Mô tả
RAG System là thành phần truy xuất thông tin từ các tài liệu y tế uy tín để cung cấp kiến thức chuyên môn cho AI model.

### Chức năng chính
- Truy xuất thông tin từ các tài liệu y tế uy tín
- Vector hóa tài liệu để tìm kiếm nhanh chóng
- Cung cấp kiến thức chuyên môn cho AI model
- Đảm bảo tính chính xác của lời khuyên y tế

### Công nghệ sử dụng
- Vector database: Pinecone, Weaviate, hoặc Chroma
- Embedding model: Sentence-BERT hoặc tương tự
- Tài liệu y tế được vector hóa

### Cách cấu hình
- Chọn vector database phù hợp
- Chọn embedding model
- Chuẩn bị và vector hóa tài liệu y tế

### Quy trình xử lý
1. Nhận truy vấn từ Chatbot Service Core
2. Vector hóa truy vấn
3. Tìm kiếm tài liệu tương tự trong vector database
4. Trả kết quả về cho Chatbot Service Core

### Cách tương tác với các thành phần khác
- Nhận yêu cầu từ Chatbot Service Core
- Trả kết quả về cho Chatbot Service Core và Ollama AI Model

## 5. n8n Automation

### Mô tả
n8n Automation là thành phần tự động hóa workflow, đặc biệt là trong các tình huống khẩn cấp cần thông báo cho bác sĩ.

### Chức năng chính
- Tự động hóa các quy trình như gửi thông báo cho bác sĩ
- Xử lý các tình huống khẩn cấp
- Tích hợp với các dịch vụ bên ngoài (SMS, email, v.v.)

### Công nghệ sử dụng
- Nền tảng: n8n
- Workflow: Định nghĩa trong file JSON
- Tích hợp: REST API, Webhook

### Cách cấu hình
- Thiết kế workflow trong n8n
- Cấu hình kết nối với các dịch vụ bên ngoài
- Định nghĩa điều kiện kích hoạt workflow

### Ví dụ về workflow
1. Nhận cảnh báo từ Chatbot Service Core
2. Xác định bác sĩ đang trực
3. Gửi SMS/email thông báo
4. Ghi log sự kiện

### Cách tương tác với các thành phần khác
- Nhận yêu cầu từ Chatbot Service Core
- Gửi thông báo đến các dịch vụ bên ngoài

## 6. Database

### Mô tả
Database là thành phần lưu trữ dữ liệu lâu dài, đặc biệt là lịch sử trò chuyện giữa người dùng và chatbot.

### Chức năng chính
- Lưu trữ lịch sử trò chuyện để phục vụ cho:
  - Lưu trữ lâu dài
  - Testing
  - Fine-tune model trong tương lai

### Công nghệ sử dụng
- Hệ quản trị cơ sở dữ liệu: MySQL (tối ưu cho LLM và production environments)
- Containerization: Docker
- ORM: Sequelize (Node.js) với mysql2 driver

### Schema dữ liệu
- Bảng `conversations`: Lưu trữ thông tin cuộc trò chuyện
- Bảng `messages`: Lưu trữ tin nhắn
- Bảng `users`: Lưu trữ thông tin người dùng

### Cách tương tác với các thành phần khác
- Nhận dữ liệu từ Chatbot Service Core để lưu trữ
- Cung cấp dữ liệu lịch sử khi được yêu cầu

## 7. Cache/Session Store

### Mô tả
Cache/Session Store là thành phần lưu trữ tạm thời thông tin ngữ cảnh của cuộc trò chuyện hiện tại.

### Chức năng chính
- Lưu trữ context của cuộc trò chuyện hiện tại
- Giúp mô hình nhớ được thông tin từ các tin nhắn trước như:
  - Tên bệnh nhân
  - Triệu chứng đã mô tả
  - Thông số sức khỏe đã gửi

### Công nghệ sử dụng
- Hệ thống cache: Redis
- Containerization: Docker
- Thời gian sống: Có thể cấu hình (ví dụ: 1 giờ)

### Cách cấu hình
- Cấu hình thời gian sống của session
- Cấu hình kích thước bộ nhớ cache
- Cấu hình bảo mật truy cập

### Cách tương tác với các thành phần khác
- Nhận dữ liệu từ Chatbot Service Core để lưu trữ tạm thời
- Cung cấp dữ liệu ngữ cảnh khi được yêu cầu