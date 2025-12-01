# TỔNG QUAN HỆ THỐNG SMART HEALTH

## 1. GIỚI THIỆU

### 1.1. Tên Đề Tài
**HỆ THỐNG QUẢN LÝ CHĂM SÓC SỨC KHỎE THÔNG MINH (SMART HEALTH)**

### 1.2. Mục Đích
Xây dựng hệ thống quản lý chăm sóc sức khỏe toàn diện, hỗ trợ:
- Đặt lịch khám bệnh trực tuyến
- Quản lý hồ sơ bệnh án điện tử
- Tư vấn sức khỏe qua chatbot AI
- Dự đoán bệnh lý bằng Machine Learning
- Thanh toán trực tuyến qua MoMo và VNPay
- Chat realtime giữa bác sĩ và bệnh nhân
- Quản lý thuốc và đơn thuốc
- Thông báo đa kênh (Email, Push Notification)

### 1.3. Phạm Vi Ứng Dụng
- **Bệnh viện/Phòng khám**: Quản lý lịch hẹn, bệnh nhân, bác sĩ
- **Bệnh nhân**: Đặt lịch khám, xem hồ sơ sức khỏe, tư vấn trực tuyến
- **Bác sĩ**: Quản lý lịch làm việc, khám bệnh, kê đơn thuốc
- **Lễ tân**: Check-in bệnh nhân, quản lý lịch hẹn
- **Quản trị viên**: Quản lý toàn bộ hệ thống

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Kiến Trúc Tổng Thể

Hệ thống áp dụng kiến trúc **Microservices** với các thành phần sau:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
├─────────────────────┬───────────────────────────────────────────┤
│  Web Application    │        Mobile Application                 │
│  (Next.js 15)       │        (React Native/Expo)                │
└──────────┬──────────┴───────────────────┬───────────────────────┘
           │                              │
           └──────────────┬───────────────┘
                          │
           ┌──────────────▼──────────────┐
           │      API Gateway            │
           │      (Node.js/Express)      │
           │      Port: 8080             │
           └──────────────┬──────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    │         ┌───────────▼──────────┐         │
    │         │   Message Broker     │         │
    │         │   (Apache Kafka)     │         │
    │         └───────────┬──────────┘         │
    │                     │                     │
┌───▼────┬────▼────┬─────▼─────┬──────▼──┬────▼────┬─────▼─────┐
│ Auth   │Patient  │  Doctor   │Appoint- │ Chat    │Notification│
│Service │Service  │  Service  │ment     │Service  │  Service   │
│:8081   │:8082    │  :8083    │:8084    │:8085    │   :8088    │
│Spring  │NestJS   │  NestJS   │NestJS   │Node.js  │  NestJS    │
│Boot    │         │           │         │+Socket  │            │
└────┬───┴────┬────┴─────┬─────┴────┬────┴────┬────┴─────┬──────┘
     │        │          │          │         │          │
┌────▼────┬───▼────┬─────▼─────┬────▼────┬────▼─────┬────▼──────┐
│Prediction│Chatbot │ Medicine │ Billing │Telemedicine│ Other    │
│ Service  │Service │ Service  │Service  │  Service   │Services  │
│  :8086   │:8087   │  :8089   │ :8090   │            │          │
│  FastAPI │Python  │  Spring  │ Spring  │            │          │
│          │+LLM    │  Boot    │  Boot   │            │          │
└──────────┴────────┴──────────┴─────────┴────────────┴──────────┘
           │                │               │
     ┌─────▼─────┐    ┌─────▼──────┐  ┌─────▼─────┐
     │  MongoDB  │    │   MySQL    │  │  ChromaDB │
     │(Prediction│    │ (Multiple  │  │ (Vector   │
     │   Data)   │    │   DBs)     │  │    DB)    │
     └───────────┘    └────────────┘  └───────────┘
```

### 2.2. Công Nghệ Sử Dụng

#### Backend Services:
| Service | Công nghệ | Port | Database | Mô tả |
|---------|-----------|------|----------|-------|
| **API Gateway** | Node.js, Express | 8080 | Redis | Điểm truy cập trung tâm |
| **Auth Service** | Spring Boot 3.5 | 8081 | MySQL | Xác thực & phân quyền |
| **Patient Service** | NestJS 11 | 8082 | MySQL | Quản lý bệnh nhân |
| **Doctor Service** | NestJS 11 | 8083 | MySQL | Quản lý bác sĩ |
| **Appointment Service** | NestJS 11 | 8084 | MySQL | Quản lý lịch hẹn |
| **Chat Service** | Node.js, Socket.IO | 8085 | MySQL | Chat realtime |
| **Prediction Service** | FastAPI, TensorFlow | 8086 | MongoDB | Dự đoán bệnh |
| **Chatbot Service** | FastAPI, LangChain | 8087 | ChromaDB | Tư vấn AI |
| **Notification Service** | NestJS 11 | 8088 | MySQL | Thông báo |
| **Medicine Service** | Spring Boot 3.5 | 8089 | MySQL | Quản lý thuốc |
| **Billing Service** | Spring Boot 3.5 | 8090 | MySQL | Thanh toán |

#### Frontend Applications:
| Application | Công nghệ | Port | Đối tượng sử dụng |
|-------------|-----------|------|-------------------|
| **Web Application** | Next.js 15, React 19, TypeScript | 3000 | Bác sĩ, Admin, Lễ tân |
| **Mobile Application** | React Native, Expo 54 | - | Bệnh nhân |

#### Infrastructure:
- **Message Broker**: Apache Kafka 7.5
- **Cache**: Redis 7
- **Container**: Docker & Docker Compose
- **Database**: MySQL 8, MongoDB, ChromaDB

### 2.3. Design Patterns & Principles

#### 2.3.1. Microservices Pattern
- **Service Independence**: Mỗi service hoạt động độc lập
- **Database per Service**: Mỗi service có database riêng
- **API Gateway Pattern**: Điểm truy cập tập trung
- **Event-Driven Architecture**: Giao tiếp bất đồng bộ qua Kafka

#### 2.3.2. Backend Patterns
- **Repository Pattern**: Tách biệt logic truy cập dữ liệu
- **Service Layer Pattern**: Business logic tập trung
- **DTO Pattern**: Truyền dữ liệu giữa các layer
- **Dependency Injection**: Quản lý dependencies
- **Guard & Middleware Pattern**: Bảo mật & xử lý request
- **Interceptor Pattern**: Transform response/request

#### 2.3.3. Frontend Patterns
- **Redux Toolkit**: State management
- **React Query**: Server state management
- **Component Composition**: Tái sử dụng component
- **Custom Hooks**: Logic tái sử dụng
- **Provider Pattern**: Context management

---

## 3. TÍNH NĂNG CHÍNH

### 3.1. Module Xác Thực & Phân Quyền
- Đăng ký, đăng nhập (JWT)
- Refresh token
- Phân quyền theo role: PATIENT, DOCTOR, ADMIN, RECEPTIONIST
- OAuth2 (tùy chọn)

### 3.2. Module Quản Lý Bệnh Nhân
- Hồ sơ bệnh nhân (Patient Profile)
- Lịch sử khám bệnh
- Kết quả xét nghiệm
- Chỉ số sinh tồn (Vital Signs)
- Hồ sơ y tế điện tử (EMR)

### 3.3. Module Quản Lý Bác Sĩ
- Hồ sơ bác sĩ (chuyên khoa, bằng cấp, kinh nghiệm)
- Quản lý lịch làm việc (Doctor Availability)
- Khung giờ khám (Appointment Slots)
- Thời gian nghỉ/block time
- Đánh giá bác sĩ (Rating & Reviews)

### 3.4. Module Đặt Lịch Khám
- Tìm kiếm bác sĩ theo chuyên khoa
- Đặt lịch khám theo khung giờ
- Tích hợp Google Calendar
- Check-in bệnh nhân (Receptionist)
- Quản lý trạng thái appointment: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
- Đề xuất tái khám (Follow-up Suggestions)

### 3.5. Module Xét Nghiệm
- Yêu cầu xét nghiệm (Lab Test Orders)
- Kết quả xét nghiệm (Lab Test Results)
- Các loại xét nghiệm: Huyết học, Hóa sinh, Vi sinh, X-quang, CT, MRI...

### 3.6. Module Hồ Sơ Y Tế
- Ghi chú khám bệnh (Medical Records)
- Chẩn đoán (Diagnosis)
- Kê đơn thuốc (Prescriptions)
- Liên kết với appointment, vital signs, lab tests

### 3.7. Module Chat Realtime
- Chat 1-1 giữa bác sĩ và bệnh nhân
- Socket.IO cho realtime messaging
- Lưu trữ lịch sử tin nhắn
- Thông báo tin nhắn mới

### 3.8. Module Chatbot AI
- Tư vấn sức khỏe tự động
- RAG (Retrieval-Augmented Generation)
- ChromaDB cho vector search
- LangChain integration
- Ollama/HuggingFace LLM

### 3.9. Module Dự Đoán Bệnh
- Dự đoán bệnh tim mạch
- TensorFlow/Keras models
- API RESTful
- Lưu trữ kết quả dự đoán

### 3.10. Module Quản Lý Thuốc
- Danh mục thuốc
- Kho thuốc
- Đơn thuốc điện tử
- Hướng dẫn sử dụng

### 3.11. Module Thanh Toán
- Tích hợp MoMo Payment Gateway
- Tích hợp VNPay Payment Gateway
- Quản lý hóa đơn (Invoices)
- Lịch sử giao dịch
- IPN (Instant Payment Notification)
- Return URL handling

### 3.12. Module Thông Báo
- Email notifications (SMTP)
- Push notifications (Firebase Cloud Messaging)
- SMS notifications (Twilio - optional)
- Quản lý thiết bị (User Devices)
- Kafka consumer cho events

---

## 4. LUỒNG DỮ LIỆU

### 4.1. Luồng Đăng Ký & Đăng Nhập
```
Client → API Gateway → Auth Service
                         ↓
                      MySQL (users)
                         ↓
                    Generate JWT
                         ↓
                    Return tokens
                         ↓
                    Kafka Event → Other Services
```

### 4.2. Luồng Đặt Lịch Khám
```
Client → API Gateway → Appointment Service
                         ↓
                  Check doctor availability
                         ↓
                  Create appointment (MySQL)
                         ↓
                  Send to Google Calendar
                         ↓
                  Kafka Event → Notification Service
                         ↓
                  Send email confirmation
                         ↓
                  Billing Service creates invoice
```

### 4.3. Luồng Chat Realtime
```
Client (Socket.IO) → Chat Service
                         ↓
                  Authenticate JWT
                         ↓
                  Save message (MySQL)
                         ↓
                  Emit to recipient (Socket)
                         ↓
                  Kafka Event → Notification Service
```

### 4.4. Luồng Thanh Toán
```
Client → API Gateway → Billing Service
                         ↓
                  Create payment request
                         ↓
                  MoMo/VNPay Gateway
                         ↓
                  Return payment URL
                         ↓
                  Client completes payment
                         ↓
                  IPN callback
                         ↓
                  Update payment status
                         ↓
                  Kafka Event → Update appointment
```

---

## 5. BẢO MẬT

### 5.1. Authentication & Authorization
- **JWT (JSON Web Token)**: Access token (24h) + Refresh token (7 days)
- **Spring Security**: Auth Service
- **Guards & Middleware**: NestJS services
- **Role-based Access Control (RBAC)**

### 5.2. API Security
- **API Gateway Secret**: Internal service authentication
- **Rate Limiting**: 100 requests/15 minutes
- **CORS**: Whitelist origins
- **Helmet.js**: Security headers
- **Input Validation**: class-validator, Joi

### 5.3. Data Security
- **Password Hashing**: BCrypt
- **HTTPS/SSL**: Production environment
- **Environment Variables**: Sensitive data
- **Database Encryption**: Sensitive fields

### 5.4. Internal Communication
- **Gateway Secret**: X-Gateway-Secret header
- **Internal API Keys**: Service-to-service calls

---

## 6. TRIỂN KHAI

### 6.1. Development Environment
```bash
# Start all services
docker-compose -f docker-compose-full.yml up

# Start specific services
docker-compose up api-gateway auth-service patient-service
```

### 6.2. Environment Variables
Mỗi service có file `.env` riêng với cấu hình:
- Database connection
- JWT secrets
- Service URLs
- External API keys
- Kafka brokers

### 6.3. Databases
| Database | Services | Purpose |
|----------|----------|---------|
| `smart_health_auth` | Auth Service | Users, refresh tokens |
| `smart_health_patient` | Patient Service | Patients |
| `smart_health_doctor` | Doctor Service | Doctors, slots, ratings |
| `smart_health_appointment` | Appointment Service | Appointments, medical records, lab tests |
| `smart_health_chat` | Chat Service | Conversations, messages |
| `smart_health_notification` | Notification Service | Notifications, user devices |
| `smart_health_medicine` | Medicine Service | Medicines, prescriptions |
| `smart_health_billing` | Billing Service | Invoices, payments, transactions |
| `smart_health_prediction` | Prediction Service | Prediction results (MongoDB) |

---

## 7. MONITORING & LOGGING

### 7.1. Logging
- **Winston**: Node.js services
- **SLF4J + Logback**: Spring Boot services
- **Daily Rotate File**: Log rotation
- **Log Levels**: ERROR, WARN, INFO, DEBUG

### 7.2. Health Checks
Mỗi service có endpoint:
- `GET /health` - Health status
- `GET /` - Basic info (name, version, uptime)

### 7.3. API Documentation
- Swagger/OpenAPI (planned)
- Postman collections
- README files

---

## 8. SCALABILITY & PERFORMANCE

### 8.1. Horizontal Scaling
- Docker containers có thể scale độc lập
- Kafka partitions cho message distribution
- Redis cho caching & session storage

### 8.2. Database Optimization
- Indexes trên các cột thường query
- Connection pooling
- Query optimization

### 8.3. Caching Strategy
- Redis cho API Gateway
- In-memory cache cho static data
- CDN cho static assets (frontend)

---

## 9. FUTURE ENHANCEMENTS

### 9.1. Technical
- [ ] Service Mesh (Istio/Linkerd)
- [ ] Distributed Tracing (Jaeger/Zipkin)
- [ ] Centralized Logging (ELK Stack)
- [ ] API Gateway alternatives (Kong/Traefik)
- [ ] GraphQL API
- [ ] gRPC for internal communication

### 9.2. Features
- [ ] Video consultation (WebRTC)
- [ ] Prescription refill reminders
- [ ] Health tracking (wearables integration)
- [ ] Insurance claims
- [ ] Multi-language support
- [ ] Advanced analytics & reporting

---

## 10. KẾT LUẬN

Hệ thống Smart Health là một giải pháp toàn diện cho quản lý chăm sóc sức khỏe, áp dụng các công nghệ hiện đại và best practices trong phát triển phần mềm. Kiến trúc microservices đảm bảo tính mở rộng, bảo trì dễ dàng và khả năng tích hợp các tính năng mới trong tương lai.

---

**Ngày cập nhật**: 2024
**Phiên bản**: 1.0.0
**Tác giả**: Smart Health Team