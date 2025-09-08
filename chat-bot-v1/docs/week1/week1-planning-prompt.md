# Prompt: Kế hoạch Hành động Tuần 1 - Chatbot Service

## 🎯 Mục tiêu tổng quan

Tạo một kế hoạch hành động chi tiết cho Tuần 1 của dự án Chatbot Service dựa trên phân tích tài liệu kỹ thuật hiện có (`architecture.md`, `roadmap.md`, `deployment.md`, `API.md`, `components.md`). Kế hoạch cần được chia thành từng ngày cụ thể và bao gồm tất cả các nhiệm vụ ưu tiên.

## 📋 Yêu cầu chi tiết

### 1. Phân tích tài liệu hiện có

- Đọc và phân tích các tài liệu: `architecture.md`, `roadmap.md`, `deployment.md`, `API.md`, `components.md`
- Xác định các thành phần cốt lõi cần triển khai trong tuần đầu
- Hiểu rõ API specification từ `API.md`
- Nắm bắt deployment requirements từ `deployment.md`

### 2. Kế hoạch hành động theo ngày

Tạo kế hoạch chi tiết cho 5 ngày làm việc (thứ 2 đến thứ 6):

#### 📅 Ngày 1: Thiết lập môi trường phát triển

- [ ] Cài đặt Node.js (version 18+) và npm
- [ ] Cài đặt Python 3.8+ và pip
- [ ] Cài đặt Docker và Docker Compose
- [ ] Cài đặt Git và cấu hình repository
- [ ] Thiết lập IDE/Editor với extensions cần thiết
- [ ] Verify development environment với quick test

#### 📅 Ngày 2: Cài đặt Dependencies và Services

- [ ] Pull và cài đặt Ollama
- [ ] Download AI model (Llama2 7B hoặc Mistral 7B)
- [ ] Cài đặt MySQL với Docker
- [ ] Cài đặt Redis với Docker
- [ ] Kiểm tra kết nối giữa các services
- [ ] Tạo docker-compose.yml cho local development

#### 📅 Ngày 3: Triển khai Chatbot Service Core

- [ ] Khởi tạo project structure với Express.js/FastAPI
- [ ] Implement health check endpoint (`GET /health`)
- [ ] Implement basic chat endpoint (`POST /api/chat`)
- [ ] Implement error handling middleware
- [ ] Implement request validation
- [ ] Tạo basic logging system

#### 📅 Ngày 4: Database Integration & API Implementation

- [ ] Thiết lập kết nối MySQL với ORM (Sequelize + mysql2 driver)
- [ ] Thiết lập kết nối Redis cho session management
- [ ] Implement database schema cho conversations và messages
- [ ] Implement session storage với Redis
- [ ] Implement history endpoint (`GET /api/history/{userId}`)
- [ ] Implement session management endpoint (`DELETE /api/session/{sessionId}`)

#### 📅 Ngày 5: Docker Configuration & Testing

- [ ] Hoàn thiện docker-compose.yml với tất cả services
- [ ] Tạo Dockerfile cho Chatbot Service
- [ ] Implement environment variables configuration
- [ ] Tạo automated tests cho API endpoints
- [ ] Test integration với Ollama AI model
- [ ] Test end-to-end flow với tất cả components
- [ ] Documentation và setup instructions

### 3. Yêu cầu đầu ra

Kế hoạch phải bao gồm:

#### ✅ Các nhiệm vụ cụ thể

- Mỗi nhiệm vụ phải được mô tả rõ ràng, có thể hành động ngay
- Ưu tiên các tasks quan trọng cho foundation
- Include estimated time cho mỗi task

#### ✅ Technical Specifications

- API endpoints phải tuân thủ `API.md` specification
- Database schema phải phù hợp với requirements
- Error handling phải comprehensive
- Logging phải structured và informative

#### ✅ Success Criteria

- Service có thể chạy locally với docker-compose
- Tất cả API endpoints hoạt động correctly
- Database connections working properly
- Basic AI integration với Ollama
- Automated tests passing

#### ✅ Next Steps Planning

- Xác định các tasks cho tuần 2
- Prioritize features tiếp theo
- Identify potential risks và mitigation strategies
- Resource planning cho các phases tiếp theo

### 4. Format Requirements

- Sử dụng markdown format
- Include checklist cho mỗi ngày
- Có section cho dependencies và prerequisites
- Include commands và code snippets khi cần
- Có phần troubleshooting common issues

### 5. Phù hợp với Lộ trình tổng thể

- Align với Giai đoạn 1 trong `roadmap.md` (4-6 tuần)
- Focus on foundation trước khi advanced features
- Đảm bảo scalability và maintainability
- Tuân thủ security requirements từ `SECURITY.md`

## 🚀 Expected Output

Một file markdown hoàn chỉnh với:

1. Daily breakdown của tasks
2. Technical specifications chi tiết
3. Implementation guidelines
4. Testing strategy
5. Deployment instructions
6. Next steps planning

Tất cả phải actionable và align với tài liệu hiện có.
