# QUICK START GUIDE - HỆ THỐNG SMART HEALTH

## 📋 MỤC LỤC
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt cơ bản](#cài-đặt-cơ-bản)
- [Chạy toàn bộ hệ thống](#chạy-toàn-bộ-hệ-thống)
- [Chạy từng service riêng lẻ](#chạy-từng-service-riêng-lẻ)
- [Truy cập ứng dụng](#truy-cập-ứng-dụng)
- [Test tài khoản mẫu](#test-tài-khoản-mẫu)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ YÊU CẦU HỆ THỐNG

### Phần mềm cần cài đặt

#### Bắt buộc:
- ✅ **Docker Desktop 24.0+** - [Download](https://www.docker.com/products/docker-desktop)
- ✅ **Docker Compose 2.20+** (đi kèm Docker Desktop)
- ✅ **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- ✅ **Git** - [Download](https://git-scm.com/downloads)

#### Tùy chọn (cho development):
- 📦 **Node.js 18+** - [Download](https://nodejs.org/)
- ☕ **Java JDK 17+** - [Download](https://adoptium.net/)
- 🐍 **Python 3.10+** - [Download](https://www.python.org/downloads/)

### Kiểm tra version
```bash
# Kiểm tra Docker
docker --version
# Output: Docker version 24.x.x

docker-compose --version
# Output: Docker Compose version 2.x.x

# Kiểm tra MySQL
mysql --version
# Output: mysql Ver 8.0.x

# Kiểm tra Git
git --version
# Output: git version 2.x.x
```

---

## 🚀 CÀI ĐẶT CƠ BẢN

### Bước 1: Clone Repository

```bash
# Clone project từ GitHub
git clone https://github.com/your-org/smart-health.git

# Hoặc nếu bạn đã có source code, giải nén vào thư mục
cd smart-health-backend
```

### Bước 2: Setup MySQL Databases

#### 2.1. Đăng nhập MySQL
```bash
mysql -u root -p
# Nhập password MySQL của bạn
```

#### 2.2. Tạo databases
```sql
-- Tạo các databases cần thiết
CREATE DATABASE smart_health_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_patient CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_doctor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_appointment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_medicine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE smart_health_prediction;

-- Kiểm tra databases đã tạo
SHOW DATABASES LIKE 'smart_health_%';

-- Thoát MySQL
EXIT;
```

### Bước 3: Cấu hình Environment Variables

#### 3.1. Cập nhật mật khẩu MySQL trong docker-compose.yml

Mở file `docker-compose-full.yml` và tìm tất cả các dòng chứa:
```yaml
DB_PASSWORD: 1111
SPRING_DATASOURCE_PASSWORD: 1111
```

Thay đổi `1111` thành mật khẩu MySQL của bạn.

**Ví dụ:** Nếu password MySQL của bạn là `mypassword123`, thay thành:
```yaml
DB_PASSWORD: mypassword123
SPRING_DATASOURCE_PASSWORD: mypassword123
```

#### 3.2. (Tùy chọn) Tạo file .env

Bạn có thể tạo file `.env` trong thư mục gốc:
```bash
# .env
MYSQL_PASSWORD=your_mysql_password
JWT_SECRET=smartHealthSecretKeyForJWTTokenGenerationAndValidation2024
```

---

## 🏃 CHẠY TOÀN BỘ HỆ THỐNG

### Phương án 1: Chạy tất cả services (Recommended)

```bash
# Di chuyển vào thư mục project
cd smart-health-backend

# Start tất cả services
docker-compose -f docker-compose-full.yml up -d

# Xem logs
docker-compose -f docker-compose-full.yml logs -f

# Để dừng xem logs, nhấn Ctrl+C
```

### Phương án 2: Chạy từng nhóm services

#### 2.1. Chỉ chạy Infrastructure (Kafka, Redis)
```bash
docker-compose -f docker-compose-dependencies.yml up -d
```

#### 2.2. Chạy Core Services (Auth, Patient, Doctor, Appointment)
```bash
docker-compose up -d auth-service patient-service doctor-service appointment-service
```

#### 2.3. Chạy thêm Chat & Notification
```bash
docker-compose up -d chat-service notification-service
```

#### 2.4. Chạy AI Services (Optional)
```bash
docker-compose up -d prediction-service chatbot-service
```

#### 2.5. Chạy Payment Services
```bash
docker-compose up -d medicine-service billing-service
```

#### 2.6. Chạy API Gateway
```bash
docker-compose up -d api-gateway
```

### Kiểm tra trạng thái services

```bash
# Xem tất cả containers đang chạy
docker-compose -f docker-compose-full.yml ps

# Hoặc
docker ps

# Expected output:
# - healthcare-auth (8081)
# - healthcare-patient (8082)
# - healthcare-doctor (8083)
# - healthcare-appointment (8084)
# - healthcare-chat (8085)
# - healthcare-prediction (8086)
# - healthcare-chatbot (8087)
# - healthcare-notification (8088)
# - healthcare-medicine (8089)
# - healthcare-billing (8090)
# - healthcare-gateway (8080)
# - kafka
# - zookeeper
# - redis
# - chromadb
```

### Xem logs của service cụ thể

```bash
# Auth Service
docker-compose logs -f auth-service

# Patient Service
docker-compose logs -f patient-service

# API Gateway
docker-compose logs -f api-gateway

# Tất cả services
docker-compose logs -f
```

---

## 🌐 TRUY CẬP ỨNG DỤNG

### Backend Services

| Service | URL | Health Check |
|---------|-----|--------------|
| **API Gateway** | http://localhost:8080 | http://localhost:8080/health |
| Auth Service | http://localhost:8081 | http://localhost:8081/health |
| Patient Service | http://localhost:8082 | http://localhost:8082/health |
| Doctor Service | http://localhost:8083 | http://localhost:8083/health |
| Appointment Service | http://localhost:8084 | http://localhost:8084/health |
| Chat Service | http://localhost:8085 | http://localhost:8085/health |
| Prediction Service | http://localhost:8086 | http://localhost:8086/docs |
| Chatbot Service | http://localhost:8087 | http://localhost:8087/docs |
| Notification Service | http://localhost:8088 | http://localhost:8088/health |
| Medicine Service | http://localhost:8089 | http://localhost:8089/health |
| Billing Service | http://localhost:8090 | http://localhost:8090/health |

### Frontend Applications

#### Web Application (Next.js)

```bash
# Di chuyển vào thư mục web
cd smart-health-website

# Cài đặt dependencies (lần đầu)
npm install

# Chạy development server
npm run dev

# Truy cập: http://localhost:3000
```

**Default credentials:**
- Admin: `admin / Admin123!`
- Doctor: `doctor1 / Doctor123!`
- Patient: `patient1 / Patient123!`

#### Mobile Application (Expo)

```bash
# Di chuyển vào thư mục mobile
cd smart-health-mobile

# Cài đặt dependencies (lần đầu)
npm install

# Chạy Expo
npm start

# Hoặc chạy trên Android
npm run android

# Hoặc chạy trên iOS (Mac only)
npm run ios
```

**Quét QR code bằng Expo Go app:**
- iOS: Camera app
- Android: Expo Go app

---

## 👤 TEST TÀI KHOẢN MẪU

### Tạo tài khoản test qua API

#### 1. Tạo Admin Account
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@smarthealth.com",
    "password": "Admin123!",
    "role": "ADMIN"
  }'
```

#### 2. Tạo Doctor Account
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor1",
    "email": "doctor@smarthealth.com",
    "password": "Doctor123!",
    "role": "DOCTOR"
  }'
```

#### 3. Tạo Patient Account
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient1",
    "email": "patient@smarthealth.com",
    "password": "Patient123!",
    "role": "PATIENT"
  }'
```

#### 4. Login để lấy token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient1",
    "password": "Patient123!"
  }'
```

**Response sẽ chứa:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "patient1",
      "role": "PATIENT"
    }
  }
}
```

### Test các API khác

#### Get all doctors
```bash
curl -X GET http://localhost:8080/api/doctors \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Create appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "appointmentDate": "2024-02-15",
    "startTime": "09:00:00",
    "endTime": "09:30:00",
    "reason": "Annual checkup"
  }'
```

---

## 🔧 TROUBLESHOOTING

### Vấn đề 1: Container không start

**Triệu chứng:**
```bash
docker ps
# Không thấy container hoặc container bị Exit
```

**Giải pháp:**
```bash
# Xem logs để tìm lỗi
docker-compose logs service-name

# Rebuild container
docker-compose up -d --build service-name

# Hoặc xóa và tạo lại
docker-compose down
docker-compose up -d
```

### Vấn đề 2: Port already in use

**Lỗi:**
```
Error: bind: address already in use
```

**Giải pháp:**

**Windows:**
```bash
# Tìm process đang dùng port 8080
netstat -ano | findstr :8080

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Tìm process
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Vấn đề 3: Database connection failed

**Lỗi trong logs:**
```
Connection refused: connect
```

**Giải pháp:**

1. **Kiểm tra MySQL đang chạy:**
```bash
# Windows
sc query MySQL80

# Mac/Linux
sudo systemctl status mysql
```

2. **Kiểm tra password:**
- Xác nhận password trong `docker-compose-full.yml` khớp với MySQL

3. **Kiểm tra databases đã tạo:**
```bash
mysql -u root -p
SHOW DATABASES LIKE 'smart_health_%';
```

### Vấn đề 4: Kafka connection failed

**Giải pháp:**
```bash
# Restart Kafka và Zookeeper
docker-compose restart zookeeper kafka

# Đợi 30 giây để Kafka khởi động hoàn toàn
sleep 30

# Restart các services
docker-compose restart auth-service patient-service
```

### Vấn đề 5: Out of memory

**Triệu chứng:**
- Container bị kill
- Máy chạy chậm

**Giải pháp:**

1. **Tăng memory cho Docker Desktop:**
   - Settings → Resources → Memory → Tăng lên 8GB

2. **Giới hạn memory cho services:**
```yaml
# Thêm vào docker-compose.yml
services:
  auth-service:
    mem_limit: 512m
```

3. **Chỉ chạy services cần thiết:**
```bash
# Thay vì chạy tất cả, chỉ chạy core services
docker-compose up -d api-gateway auth-service patient-service doctor-service appointment-service
```

### Vấn đề 6: Frontend không connect được Backend

**Giải pháp:**

1. **Kiểm tra API Gateway đang chạy:**
```bash
curl http://localhost:8080/health
```

2. **Kiểm tra CORS settings:**
- File: `api-gateway/src/config/cors.js`
- Đảm bảo frontend URL trong whitelist

3. **Kiểm tra environment variables:**
```bash
# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:8080
```

### Vấn đề 7: Payment gateway test

**Lưu ý:**
- MoMo & VNPay đang dùng **SANDBOX/TEST environment**
- Không charge tiền thật
- Dùng test credentials trong docker-compose

**Test MoMo:**
```bash
curl -X POST http://localhost:8080/api/v1/billings/momo/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "invoice-uuid",
    "amount": 100000,
    "orderInfo": "Test payment"
  }'
```

---

## 🛑 DỪNG HỆ THỐNG

### Dừng tất cả services
```bash
docker-compose -f docker-compose-full.yml down
```

### Dừng và xóa volumes (careful!)
```bash
docker-compose -f docker-compose-full.yml down -v
```

### Dừng service cụ thể
```bash
docker-compose stop auth-service
```

### Khởi động lại service
```bash
docker-compose restart auth-service
```

---

## 📊 KIỂM TRA HỆ THỐNG

### Health Check Script

Tạo file `check-health.sh`:
```bash
#!/bin/bash

echo "Checking services health..."

services=(
  "http://localhost:8080/health:API Gateway"
  "http://localhost:8081/health:Auth Service"
  "http://localhost:8082/health:Patient Service"
  "http://localhost:8083/health:Doctor Service"
  "http://localhost:8084/health:Appointment Service"
  "http://localhost:8085/health:Chat Service"
  "http://localhost:8088/health:Notification Service"
  "http://localhost:8089/health:Medicine Service"
  "http://localhost:8090/health:Billing Service"
)

for service in "${services[@]}"; do
  url="${service%%:*}"
  name="${service##*:}"
  
  if curl -s "$url" > /dev/null; then
    echo "✅ $name - OK"
  else
    echo "❌ $name - FAILED"
  fi
done
```

Chạy:
```bash
chmod +x check-health.sh
./check-health.sh
```

### Monitoring Dashboard (Optional)

Access:
- **Redis Commander**: http://localhost:8081 (nếu có)
- **Kafka UI**: http://localhost:8082 (nếu có)

---

## 📚 TÀI LIỆU THAM KHẢO

- [Tổng quan hệ thống](./01-TONG-QUAN-HE-THONG.md)
- [Backend Services](./02-BACKEND-SERVICES.md)
- [Frontend Applications](./03-FRONTEND-APPLICATIONS.md)
- [Database Schema](./04-DATABASE-SCHEMA.md)
- [API Documentation](./05-API-DOCUMENTATION.md)
- [Deployment & Testing](./06-DEPLOYMENT-TESTING.md)

---

## 🆘 SUPPORT

### Gặp vấn đề?

1. **Xem logs:**
   ```bash
   docker-compose logs -f service-name
   ```

2. **Restart service:**
   ```bash
   docker-compose restart service-name
   ```

3. **Rebuild từ đầu:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Clean everything:**
   ```bash
   docker-compose down -v
   docker system prune -a
   # Sau đó setup lại từ đầu
   ```

### Contact
- Email: dev-team@smarthealth.com
- GitHub Issues: [Create an issue]

---

**🎉 Chúc bạn setup thành công!**

**💡 Tips:**
- Luôn check logs khi có lỗi
- Đảm bảo Docker có đủ memory (8GB+)
- Đợi services khởi động hoàn toàn (30-60s)
- Test từng service trước khi test toàn bộ

---

*Cập nhật: 2024*  
*Version: 1.0.0*