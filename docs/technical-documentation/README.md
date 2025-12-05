# TÀI LIỆU KỸ THUẬT HỆ THỐNG SMART HEALTH

## 📋 GIỚI THIỆU

Đây là tài liệu kỹ thuật đầy đủ cho hệ thống **Smart Health** - một hệ thống quản lý chăm sóc sức khỏe toàn diện được xây dựng theo kiến trúc microservices.

Tài liệu này được soạn thảo để phục vụ cho mục đích:
- ✅ Báo cáo khóa luận tốt nghiệp
- ✅ Onboarding developers mới
- ✅ Tài liệu kỹ thuật cho maintenance
- ✅ Reference cho future enhancements

---

## 📚 CẤU TRÚC TÀI LIỆU

### [01. TỔNG QUAN HỆ THỐNG](./01-TONG-QUAN-HE-THONG.md)
**Nội dung:**
- Giới thiệu hệ thống và mục đích
- Kiến trúc tổng thể (Microservices)
- Công nghệ sử dụng
- Design patterns & principles
- Tính năng chính của từng module
- Luồng dữ liệu
- Bảo mật
- Scalability & Performance

**Phù hợp cho:**
- Hiểu tổng quan hệ thống
- Trình bày kiến trúc trong báo cáo
- Giới thiệu cho stakeholders

---

### [02. BACKEND SERVICES](./02-BACKEND-SERVICES.md)
**Nội dung:**
- Chi tiết 11 backend services:
  1. API Gateway (Node.js)
  2. Auth Service (Spring Boot)
  3. Patient Service (NestJS)
  4. Doctor Service (NestJS)
  5. Appointment Service (NestJS)
  6. Chat Service (Node.js + Socket.IO)
  7. Chatbot Service (Python + LangChain)
  8. Prediction Service (FastAPI + TensorFlow)
  9. Notification Service (NestJS + Firebase)
  10. Medicine Service (Spring Boot)
  11. Billing Service (Spring Boot + MoMo/VNPay)

**Mỗi service bao gồm:**
- Tổng quan & công nghệ
- Chức năng chính
- Database schema
- API endpoints
- Dependencies
- Environment variables
- Integration points

**Phù hợp cho:**
- Developers làm việc với backend
- Hiểu rõ từng service
- API integration
- Troubleshooting

---

### [03. FRONTEND APPLICATIONS](./03-FRONTEND-APPLICATIONS.md)
**Nội dung:**
- **Web Application (Next.js 15)**
  - Cho bác sĩ, admin, lễ tân
  - Cấu trúc thư mục
  - Pages & components
  - State management (Redux Toolkit)
  - API integration
  - Real-time features
  
- **Mobile Application (React Native/Expo)**
  - Cho bệnh nhân
  - Screen flow
  - Navigation
  - Push notifications
  - Socket.IO chat

**Chi tiết:**
- Authentication flow
- State management
- API integration
- Socket.IO events
- UI/UX components
- Best practices

**Phù hợp cho:**
- Frontend developers
- UI/UX designers
- Mobile developers

---

### [04. DATABASE SCHEMA](./04-DATABASE-SCHEMA.md)
**Nội dung:**
- Tổng quan 11 databases
- Schema chi tiết cho từng database:
  - `smart_health_auth` - User accounts
  - `smart_health_patient` - Patient info
  - `smart_health_doctor` - Doctor profiles
  - `smart_health_appointment` - Appointments, medical records
  - `smart_health_chat` - Messages
  - `smart_health_notification` - Notifications
  - `smart_health_medicine` - Medicines, prescriptions
  - `smart_health_billing` - Invoices, payments
  - `smart_health_prediction` (MongoDB) - ML predictions
  - `chromadb` - Vector embeddings

**Mỗi table bao gồm:**
- Table structure
- Columns & data types
- Indexes & constraints
- Sample data
- Relationships

**Phù hợp cho:**
- Database design
- Data modeling
- Query optimization
- Migration planning

---

### [05. API DOCUMENTATION](./05-API-DOCUMENTATION.md)
**Nội dung:**
- Base URL & authentication
- Response format & status codes
- Pagination
- Chi tiết API endpoints cho tất cả services:
  - Authentication APIs
  - Patient APIs
  - Doctor APIs
  - Appointment APIs
  - Chat APIs
  - Notification APIs
  - Medicine APIs
  - Billing & Payment APIs
  - Prediction APIs
  - Chatbot APIs

**Mỗi endpoint bao gồm:**
- HTTP method & URL
- Request headers
- Request body (với validation)
- Response body
- Error codes
- Example requests/responses

**Phù hợp cho:**
- API integration
- Frontend-backend communication
- Testing
- API documentation

---

### [06. DEPLOYMENT & TESTING](./06-DEPLOYMENT-TESTING.md)
**Nội dung:**
- **Deployment Guide**
  - System requirements
  - Docker & containerization
  - Environment configuration
  - Production deployment
  
- **Testing Strategy**
  - Unit tests (Spring Boot, NestJS, React)
  - Integration tests
  - E2E tests (Cypress)
  - Load testing
  - Test coverage
  
- **CI/CD Pipeline**
  - GitHub Actions
  - GitLab CI/CD
  - Automated testing
  - Docker build & push
  - Deployment automation
  
- **Monitoring & Logging**
  - Application logging
  - Health checks
  - Metrics collection
  - ELK stack
  
- **Troubleshooting**
  - Common issues
  - Performance problems
  - Debugging guide

**Phù hợp cho:**
- DevOps engineers
- Deployment planning
- Production support
- Testing team

---

## 🎯 HƯỚNG DẪN SỬ DỤNG TÀI LIỆU

### Cho Sinh Viên Làm Khóa Luận

#### Chương 1: Giới thiệu
- Sử dụng **01-TONG-QUAN-HE-THONG.md** (phần 1-3)
- Mô tả mục đích, phạm vi ứng dụng

#### Chương 2: Cơ sở lý thuyết
- Sử dụng **01-TONG-QUAN-HE-THONG.md** (phần 2.3 Design Patterns)
- Giải thích microservices, event-driven architecture
- Các công nghệ: Spring Boot, NestJS, React, etc.

#### Chương 3: Phân tích & Thiết kế
- **01-TONG-QUAN-HE-THONG.md** (phần 2 - Kiến trúc)
- **04-DATABASE-SCHEMA.md** (toàn bộ)
- Use case diagrams (tự vẽ dựa trên tính năng)
- Sequence diagrams (dựa trên luồng dữ liệu)
- ERD (dựa trên database schema)

#### Chương 4: Cài đặt & Hiện thực
- **02-BACKEND-SERVICES.md** (chi tiết implementation)
- **03-FRONTEND-APPLICATIONS.md** (chi tiết UI/UX)
- **05-API-DOCUMENTATION.md** (API design)
- Code snippets từ project

#### Chương 5: Testing & Deployment
- **06-DEPLOYMENT-TESTING.md** (toàn bộ)
- Test cases
- Kết quả testing
- Hướng dẫn deployment

#### Chương 6: Kết luận
- Tổng kết từ **01-TONG-QUAN-HE-THONG.md** (phần 9-10)

---

### Cho Developers

#### Backend Developer
1. Đọc **01-TONG-QUAN-HE-THONG.md** để hiểu big picture
2. Đọc **02-BACKEND-SERVICES.md** cho service bạn làm việc
3. Tham khảo **04-DATABASE-SCHEMA.md** cho database
4. Sử dụng **05-API-DOCUMENTATION.md** cho API specs
5. Follow **06-DEPLOYMENT-TESTING.md** cho testing

#### Frontend Developer
1. Đọc **01-TONG-QUAN-HE-THONG.md**
2. Chi tiết trong **03-FRONTEND-APPLICATIONS.md**
3. API integration từ **05-API-DOCUMENTATION.md**
4. Testing guide từ **06-DEPLOYMENT-TESTING.md**

#### DevOps Engineer
1. **01-TONG-QUAN-HE-THONG.md** (phần 6 - Deployment)
2. **06-DEPLOYMENT-TESTING.md** (toàn bộ)
3. **02-BACKEND-SERVICES.md** (environment variables)

---

## 📊 THỐNG KÊ DỰ ÁN

### Backend
- **Microservices**: 11 services
- **Technologies**: Spring Boot, NestJS, Node.js, Python
- **Databases**: MySQL (8 databases), MongoDB, ChromaDB
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Total API Endpoints**: 100+

### Frontend
- **Web App**: Next.js 15 + React 19 + TypeScript
- **Mobile App**: React Native (Expo 54)
- **State Management**: Redux Toolkit + React Query
- **Real-time**: Socket.IO
- **Push Notifications**: Firebase Cloud Messaging

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Gateway**: API Gateway (Node.js)
- **Payment**: MoMo + VNPay integration
- **AI/ML**: TensorFlow (heart disease prediction)
- **Chatbot**: LangChain + RAG + ChromaDB

### Lines of Code (Estimated)
```
Backend:       ~50,000 lines
Frontend Web:  ~30,000 lines
Frontend Mobile: ~20,000 lines
Documentation: ~15,000 lines
Total:         ~115,000 lines
```

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
                    ┌──────────────────────┐
                    │   CLIENT APPS        │
                    ├──────────┬───────────┤
                    │  Web     │  Mobile   │
                    │ (Next.js)│  (Expo)   │
                    └──────────┴───────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │   API Gateway        │
                    │   (Port 8080)        │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
    ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │ Auth Service  │  │   Patient   │  │   Doctor     │
    │ Spring Boot   │  │   NestJS    │  │   NestJS     │
    │   :8081       │  │   :8082     │  │   :8083      │
    └───────────────┘  └─────────────┘  └──────────────┘
            │                  │                  │
    ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │ Appointment   │  │    Chat     │  │ Notification │
    │   NestJS      │  │  Socket.IO  │  │   NestJS     │
    │   :8084       │  │   :8085     │  │   :8088      │
    └───────────────┘  └─────────────┘  └──────────────┘
            │                  │                  │
    ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │ Prediction    │  │  Chatbot    │  │   Medicine   │
    │   FastAPI     │  │  LangChain  │  │ Spring Boot  │
    │   :8086       │  │   :8087     │  │   :8089      │
    └───────────────┘  └─────────────┘  └──────────────┘
            │
    ┌───────▼───────┐
    │   Billing     │
    │ Spring Boot   │
    │   :8090       │
    └───────┬───────┘
            │
    ┌───────▼──────────────────┐
    │  Infrastructure Services │
    ├──────────┬───────────────┤
    │  Kafka   │     Redis     │
    │  MySQL   │   MongoDB     │
    │ ChromaDB │               │
    └──────────┴───────────────┘
```

---

## 🚀 QUICK START

### 1. Clone Repository
```bash
git clone https://github.com/your-org/smart-health.git
cd smart-health
```

### 2. Setup Database
```bash
# Create MySQL databases
mysql -u root -p < scripts/create-databases.sql
```

### 3. Start Infrastructure
```bash
# Start Kafka, Redis, etc.
docker-compose -f docker-compose-dependencies.yml up -d
```

### 4. Start All Services
```bash
# Development mode
docker-compose -f docker-compose-full.yml up -d

# Or start individually
docker-compose up auth-service patient-service doctor-service
```

### 5. Start Frontend
```bash
# Web
cd smart-health-website
npm install
npm run dev

# Mobile
cd smart-health-mobile
npm install
npm start
```

### 6. Access Applications
- **Web**: http://localhost:3000
- **Mobile**: Expo Go app
- **API Gateway**: http://localhost:8080
- **API Docs**: http://localhost:8080/api-docs (future)

---

## 📖 REFERENCE LINKS

### Documentation
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)

### Technologies
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [Redis](https://redis.io/documentation)
- [MySQL](https://dev.mysql.com/doc/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Socket.IO](https://socket.io/docs/)
- [Firebase](https://firebase.google.com/docs)

### Payment Gateways
- [MoMo API](https://developers.momo.vn/)
- [VNPay API](https://sandbox.vnpayment.vn/apis/)

---

## 🤝 CONTRIBUTION GUIDELINES

### Code Style
- **Java**: Follow Google Java Style Guide
- **TypeScript/JavaScript**: ESLint + Prettier
- **Python**: PEP 8

### Git Workflow
```bash
# Feature branch
git checkout -b feature/ISSUE-123-add-new-feature

# Commit messages
git commit -m "feat: add appointment cancellation feature"
git commit -m "fix: resolve payment gateway timeout issue"
git commit -m "docs: update API documentation"

# Push and create PR
git push origin feature/ISSUE-123-add-new-feature
```

### Commit Message Format
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: service name or module
Subject: brief description
```

---

## 📞 SUPPORT & CONTACT

### For Technical Issues
- Create issue on GitHub
- Email: dev-team@smarthealth.com

### For Documentation
- Create PR with improvements
- Email: docs@smarthealth.com

---

## 📝 LICENSE

This project is proprietary and confidential.
© 2024 Smart Health Team. All rights reserved.

---

## 📅 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial release |
| 1.1.0 | 2024-02 | Added Billing & Payment integration |
| 1.2.0 | 2024-03 | Added AI Chatbot & Prediction |

---

## ✨ ACKNOWLEDGMENTS

Hệ thống Smart Health được phát triển bởi nhóm sinh viên khóa luận tốt nghiệp.

**Công nghệ chính:**
- Spring Boot, NestJS, Next.js, React Native
- MySQL, MongoDB, Redis, Kafka
- Docker, Socket.IO, Firebase
- TensorFlow, LangChain, ChromaDB
- MoMo, VNPay Payment Gateways

**Đặc biệt cảm ơn:**
- Giảng viên hướng dẫn
- Khoa Công nghệ Thông tin
- Cộng đồng open source

---

**🎓 Dành cho khóa luận tốt nghiệp**  
**📚 Tài liệu kỹ thuật đầy đủ & chuyên nghiệp**  
**🚀 Sẵn sàng cho production deployment**

---

*Cập nhật lần cuối: 2024*  
*Phiên bản: 1.0.0*  
*Tác giả: Smart Health Development Team*