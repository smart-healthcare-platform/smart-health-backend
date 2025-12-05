# TÀI LIỆU KỸ THUẬT BACKEND SERVICES

## MỤC LỤC
- [1. API GATEWAY](#1-api-gateway)
- [2. AUTH SERVICE](#2-auth-service)
- [3. PATIENT SERVICE](#3-patient-service)
- [4. DOCTOR SERVICE](#4-doctor-service)
- [5. APPOINTMENT SERVICE](#5-appointment-service)
- [6. CHAT SERVICE](#6-chat-service)
- [7. CHATBOT SERVICE](#7-chatbot-service)
- [8. PREDICTION SERVICE](#8-prediction-service)
- [9. NOTIFICATION SERVICE](#9-notification-service)
- [10. MEDICINE SERVICE](#10-medicine-service)
- [11. BILLING SERVICE](#11-billing-service)

---

## 1. API GATEWAY

### 1.1. Tổng Quan
- **Công nghệ**: Node.js 18+, Express.js
- **Port**: 8080
- **Database**: Redis (caching & rate limiting)
- **Vai trò**: Điểm truy cập tập trung cho tất cả client applications

### 1.2. Chức Năng Chính
- **Routing**: Điều hướng request đến các microservices
- **Authentication**: Xác thực JWT token
- **Rate Limiting**: 100 requests/15 minutes
- **Load Balancing**: Phân phối tải (future)
- **Request/Response Transformation**: Transform data
- **Caching**: Redis caching cho performance
- **CORS Handling**: Cross-origin resource sharing
- **Security**: Helmet.js, compression, validation

### 1.3. Cấu Trúc Thư Mục
```
api-gateway/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validation.middleware.js
│   ├── routes/         # Route definitions
│   │   ├── auth.routes.js
│   │   ├── patient.routes.js
│   │   ├── doctor.routes.js
│   │   ├── appointment.routes.js
│   │   └── ...
│   ├── services/       # Service integrations
│   ├── utils/          # Utility functions
│   └── app.js          # Main application
├── logs/               # Application logs
├── Dockerfile
├── Dockerfile.dev
└── package.json
```

### 1.4. Dependencies Chính
```json
{
  "express": "^4.18.2",
  "axios": "^1.6.2",
  "jsonwebtoken": "^9.0.2",
  "redis": "^4.6.10",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "morgan": "^1.10.0",
  "winston": "^3.11.0",
  "express-validator": "^7.0.1"
}
```

### 1.5. Environment Variables
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=smartHealthSecretKeyForJWTTokenGenerationAndValidation2024
JWT_ISSUER=smart-health-gateway

# Service URLs
AUTH_SERVICE_URL=http://auth-service:8081
PATIENT_SERVICE_URL=http://patient-service:8082
DOCTOR_SERVICE_URL=http://doctor-service:8083
APPOINTMENT_SERVICE_URL=http://appointment-service:8084
CHAT_SERVICE_URL=http://chat-service:8085
NOTIFICATION_SERVICE_URL=http://notification-service:8088
MEDICINE_SERVICE_URL=http://medicine-service:8089
BILLING_SERVICE_URL=http://billing-service:8090

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Security
GATEWAY_SECRET=your-secure-gateway-secret-change-in-production
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 1.6. Route Mapping
| Client Request | Target Service | Method | Auth Required |
|----------------|----------------|--------|---------------|
| `/api/auth/*` | Auth Service | ALL | No (except logout) |
| `/api/patients/*` | Patient Service | ALL | Yes |
| `/api/doctors/*` | Doctor Service | ALL | Yes |
| `/api/appointments/*` | Appointment Service | ALL | Yes |
| `/api/chat/*` | Chat Service | ALL | Yes |
| `/api/notifications/*` | Notification Service | ALL | Yes |
| `/api/medicines/*` | Medicine Service | ALL | Yes |
| `/api/billings/*` | Billing Service | ALL | Yes |

### 1.7. Security Features
- **JWT Validation**: Verify access tokens
- **Role-based Access Control**: Check user permissions
- **Rate Limiting**: Prevent DDoS attacks
- **Request Sanitization**: Prevent injection attacks
- **Security Headers**: Helmet.js configuration
- **CORS Policy**: Whitelist allowed origins

---

## 2. AUTH SERVICE

### 2.1. Tổng Quan
- **Công nghệ**: Spring Boot 3.5.4, Java 17
- **Port**: 8081
- **Database**: MySQL (`smart_health_auth`)
- **Framework**: Spring Security, JWT

### 2.2. Chức Năng Chính
- Đăng ký tài khoản (PATIENT, DOCTOR, ADMIN, RECEPTIONIST)
- Đăng nhập & tạo JWT tokens
- Refresh token mechanism
- Quản lý users
- Kafka event publishing (user.created, user.updated)

### 2.3. Database Schema

#### Table: `users`
```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.4. API Endpoints

#### POST `/api/v1/auth/register`
**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "PATIENT"
}
```
**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "PATIENT"
  }
}
```

#### POST `/api/v1/auth/login`
**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "PATIENT"
    }
  }
}
```

#### POST `/api/v1/auth/refresh`
#### POST `/api/v1/auth/logout`
#### GET `/api/v1/users/me`
#### PUT `/api/v1/users/{id}`

### 2.5. Dependencies (build.gradle)
```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    implementation 'org.springframework.kafka:spring-kafka'
    runtimeOnly 'com.mysql:mysql-connector-j'
    compileOnly 'org.projectlombok:lombok'
}
```

### 2.6. JWT Configuration
```properties
JWT_SECRET=smartHealthSecretKeyForJWTTokenGenerationAndValidation2024
JWT_EXPIRATION=86400000  # 24 hours
JWT_REFRESH_EXPIRATION=604800000  # 7 days
```

### 2.7. Kafka Events
- **Topic**: `user-events`
- **Events**: 
  - `user.registered`
  - `user.updated`
  - `user.deleted`

---

## 3. PATIENT SERVICE

### 3.1. Tổng Quan
- **Công nghệ**: NestJS 11, TypeScript, TypeORM
- **Port**: 8082
- **Database**: MySQL (`smart_health_patient`)

### 3.2. Chức Năng Chính
- Quản lý thông tin bệnh nhân
- CRUD operations
- Tìm kiếm & filter bệnh nhân
- Kafka consumer (user.registered events)
- Internal API cho các services khác

### 3.3. Database Schema

#### Entity: `Patient`
```typescript
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;  // Reference to Auth Service

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'blood_type', nullable: true })
  bloodType: string;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ name: 'emergency_contact', nullable: true })
  emergencyContact: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 3.4. API Endpoints

#### GET `/api/patients`
- Query params: page, limit, search, gender, bloodType
- Response: Paginated list of patients

#### GET `/api/patients/:id`
#### POST `/api/patients`
#### PUT `/api/patients/:id`
#### DELETE `/api/patients/:id`
#### GET `/api/patients/user/:userId`

### 3.5. Dependencies (package.json)
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/typeorm": "^11.0.0",
  "@nestjs/microservices": "^11.1.6",
  "typeorm": "^0.3.26",
  "mysql2": "^3.14.4",
  "kafkajs": "^2.2.4",
  "class-validator": "^0.14.2",
  "class-transformer": "^0.5.1"
}
```

### 3.6. Kafka Integration
- **Consumer Group**: `patient-service-group`
- **Subscribed Topics**: `user-events`
- **Event Handlers**:
  - `user.registered` → Create patient profile

---

## 4. DOCTOR SERVICE

### 4.1. Tổng Quan
- **Công nghệ**: NestJS 11, TypeScript, TypeORM
- **Port**: 8083
- **Database**: MySQL (`smart_health_doctor`)

### 4.2. Chức Năng Chính
- Quản lý thông tin bác sĩ
- Quản lý lịch làm việc (Availability)
- Quản lý khung giờ khám (Appointment Slots)
- Quản lý thời gian nghỉ (Block Time)
- Quản lý bằng cấp & chứng chỉ
- Đánh giá bác sĩ (Ratings)

### 4.3. Database Schema

#### Entity: `Doctor`
```typescript
@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column()
  specialization: string;

  @Column({ name: 'license_number', unique: true })
  licenseNumber: string;

  @Column({ name: 'years_of_experience' })
  yearsOfExperience: number;

  @Column({ type: 'text', nullable: true })
  biography: string;

  @Column({ name: 'consultation_fee', type: 'decimal' })
  consultationFee: number;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({ default: true })
  available: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Entity: `AppointmentSlot`
```typescript
@Entity('appointment_slots')
export class AppointmentSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;
}
```

#### Entity: `DoctorAvailability`
```typescript
@Entity('doctor_availabilities')
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;
}
```

#### Entity: `DoctorRating`
```typescript
@Entity('doctor_ratings')
export class DoctorRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ type: 'int', comment: '1-5 stars' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 4.4. API Endpoints

#### Doctors
- GET `/api/doctors` - List all doctors (with filters)
- GET `/api/doctors/:id` - Get doctor details
- POST `/api/doctors` - Create doctor profile
- PUT `/api/doctors/:id` - Update doctor profile
- GET `/api/doctors/specialization/:spec` - Filter by specialization

#### Appointment Slots
- GET `/api/doctors/appointment-slots/doctor/:doctorId`
- POST `/api/doctors/appointment-slots` - Create slots
- PUT `/api/doctors/appointment-slots/:id` - Update slot
- DELETE `/api/doctors/appointment-slots/:id`

#### Availability
- GET `/api/doctors/:doctorId/availability`
- POST `/api/doctors/:doctorId/availability`
- PUT `/api/doctors/availability/:id`

#### Ratings
- POST `/api/doctors/:doctorId/ratings`
- GET `/api/doctors/:doctorId/ratings`

---

## 5. APPOINTMENT SERVICE

### 5.1. Tổng Quan
- **Công nghệ**: NestJS 11, TypeScript, TypeORM
- **Port**: 8084
- **Database**: MySQL (`smart_health_appointment`)
- **Integrations**: Google Calendar API, SMTP

### 5.2. Chức Năng Chính
- Quản lý lịch hẹn khám bệnh
- Check-in bệnh nhân (Receptionist role)
- Quản lý hồ sơ y tế (Medical Records)
- Quản lý chỉ số sinh tồn (Vital Signs)
- Quản lý xét nghiệm (Lab Tests)
- Đề xuất tái khám (Follow-up Suggestions)
- Tích hợp Google Calendar
- Gửi email xác nhận

### 5.3. Database Schema

#### Entity: `Appointment`
```typescript
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'enum', enum: AppointmentStatus })
  status: AppointmentStatus;
  // PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'checked_in_at', nullable: true })
  checkedInAt: Date;

  @Column({ name: 'google_event_id', nullable: true })
  googleEventId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Entity: `MedicalRecord`
```typescript
@Entity('medical-records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  prescription: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
```

#### Entity: `VitalSign`
```typescript
@Entity('vital-signs')
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ type: 'decimal', nullable: true })
  temperature: number;  // Celsius

  @Column({ name: 'blood_pressure_systolic', nullable: true })
  bloodPressureSystolic: number;  // mmHg

  @Column({ name: 'blood_pressure_diastolic', nullable: true })
  bloodPressureDiastolic: number;  // mmHg

  @Column({ name: 'heart_rate', nullable: true })
  heartRate: number;  // bpm

  @Column({ name: 'respiratory_rate', nullable: true })
  respiratoryRate: number;  // breaths/min

  @Column({ type: 'decimal', nullable: true })
  weight: number;  // kg

  @Column({ type: 'decimal', nullable: true })
  height: number;  // cm

  @Column({ name: 'oxygen_saturation', nullable: true })
  oxygenSaturation: number;  // %

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}
```

#### Entity: `LabTest`
```typescript
@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: LabTestType })
  type: LabTestType;
  // BLOOD, URINE, IMAGING, BIOPSY, etc.

  @Column({ type: 'decimal', nullable: true })
  price: number;
}
```

#### Entity: `LabTestOrder`
```typescript
@Entity('lab_test_orders')
export class LabTestOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ name: 'lab_test_id' })
  labTestId: string;

  @Column({ type: 'enum', enum: LabOrderStatus })
  status: LabOrderStatus;
  // ORDERED, IN_PROGRESS, COMPLETED, CANCELLED

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'ordered_at' })
  orderedAt: Date;

  @ManyToOne(() => LabTest)
  @JoinColumn({ name: 'lab_test_id' })
  labTest: LabTest;
}
```

#### Entity: `LabTestResult`
```typescript
@Entity('lab-test-results')
export class LabTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lab_test_order_id' })
  labTestOrderId: string;

  @Column({ type: 'text' })
  result: string;

  @Column({ name: 'result_file_url', nullable: true })
  resultFileUrl: string;

  @Column({ type: 'enum', enum: LabResultStatus })
  status: LabResultStatus;
  // NORMAL, ABNORMAL, CRITICAL

  @Column({ type: 'text', nullable: true })
  interpretation: string;

  @CreateDateColumn({ name: 'resulted_at' })
  resultedAt: Date;

  @OneToOne(() => LabTestOrder)
  @JoinColumn({ name: 'lab_test_order_id' })
  labTestOrder: LabTestOrder;
}
```

### 5.4. API Endpoints

#### Appointments
- GET `/api/appointments` - List appointments (with filters)
- GET `/api/appointments/:id`
- POST `/api/appointments` - Create appointment
- PUT `/api/appointments/:id`
- DELETE `/api/appointments/:id`
- PATCH `/api/appointments/:id/status` - Update status
- GET `/api/appointments/patient/:patientId`
- GET `/api/appointments/doctor/:doctorId`

#### Receptionist Endpoints
- GET `/api/appointments/receptionist/today` - Today's appointments
- PATCH `/api/appointments/receptionist/:id/check-in` - Check-in patient

#### Medical Records
- GET `/api/appointments/medical-records`
- GET `/api/appointments/medical-records/:id`
- POST `/api/appointments/medical-records`
- PUT `/api/appointments/medical-records/:id`
- GET `/api/appointments/medical-records/appointment/:appointmentId`
- GET `/api/appointments/medical-records/patient/:patientId`

#### Vital Signs
- POST `/api/appointments/vital-signs`
- GET `/api/appointments/vital-signs/appointment/:appointmentId`
- GET `/api/appointments/vital-signs/patient/:patientId`

#### Lab Tests
- GET `/api/appointments/lab-tests` - List available tests
- POST `/api/appointments/lab-test-orders` - Order a test
- GET `/api/appointments/lab-test-orders/patient/:patientId`
- POST `/api/appointments/lab-test-results` - Submit results
- GET `/api/appointments/lab-test-results/:orderId`

### 5.5. Google Calendar Integration
```typescript
// Create event when appointment is confirmed
const event = {
  summary: `Appointment: ${patientName} with Dr. ${doctorName}`,
  description: `Reason: ${reason}`,
  start: {
    dateTime: `${appointmentDate}T${startTime}`,
    timeZone: 'Asia/Ho_Chi_Minh'
  },
  end: {
    dateTime: `${appointmentDate}T${endTime}`,
    timeZone: 'Asia/Ho_Chi_Minh'
  },
  attendees: [
    { email: patientEmail },
    { email: doctorEmail }
  ]
};
```

### 5.6. Email Notifications
- Confirmation email khi đặt lịch
- Reminder email trước 24h
- Cancellation email
- Rescheduling email

---

## 6. CHAT SERVICE

### 6.1. Tổng Quan
- **Công nghệ**: Node.js, TypeScript, Socket.IO
- **Port**: 8085
- **Database**: MySQL (`smart_health_chat`)
- **Real-time**: WebSocket connections

### 6.2. Chức Năng Chính
- Chat 1-1 giữa doctor và patient
- Real-time messaging
- Lưu trữ lịch sử chat
- Thông báo tin nhắn mới
- Online/offline status

### 6.3. Database Schema

#### Table: `conversations`
```sql
CREATE TABLE conversations (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    last_message_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_conversation (patient_id, doctor_id)
);
```

#### Table: `messages`
```sql
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY,
    conversation_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    sender_type ENUM('PATIENT', 'DOCTOR') NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'FILE') DEFAULT 'TEXT',
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### 6.4. Socket Events

#### Client → Server
```typescript
// Connect
socket.on('connection', (socket) => {
  // Authenticate socket
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  
  // Join user's room
  socket.join(`user:${user.id}`);
});

// Send message
socket.on('send_message', (data) => {
  // { conversationId, content, messageType }
});

// Mark as read
socket.on('mark_read', (messageId) => {});

// Typing indicator
socket.on('typing', (conversationId) => {});
```

#### Server → Client
```typescript
// New message
socket.emit('new_message', {
  id: 'uuid',
  conversationId: 'uuid',
  senderId: 'uuid',
  senderType: 'DOCTOR',
  content: 'Message text',
  createdAt: '2024-01-01T10:00:00Z'
});

// Message read
socket.emit('message_read', { messageId });

// User typing
socket.emit('user_typing', { userId, conversationId });
```

### 6.5. REST API Endpoints
- GET `/api/chat/conversations` - Get user's conversations
- GET `/api/chat/conversations/:id/messages` - Get messages
- POST `/api/chat/conversations` - Create conversation
- PUT `/api/chat/messages/:id/read` - Mark as read

---

## 7. CHATBOT SERVICE

### 7.1. Tổng Quan
- **Công nghệ**: Python 3.10+, FastAPI, LangChain
- **Port**: 8087
- **Database**: ChromaDB (Vector Database)
- **AI Model**: Ollama (local) or HuggingFace

### 7.2. Chức Năng Chính
- Tư vấn sức khỏe tự động
- RAG (Retrieval-Augmented Generation)
- Vector search trong knowledge base
- Context-aware responses
- Medical knowledge base

### 7.3. Kiến Trúc RAG
```
User Query
    ↓
Intent Classification
    ↓
Rules Engine (FAQ matching)
    ↓
RAG Pipeline
    ├─→ Embedding (sentence-transformers)
    ├─→ Vector Search (ChromaDB)
    ├─→ Context Retrieval
    └─→ LLM Generation (Ollama/HuggingFace)
    ↓
Response
```

### 7.4. File Structure
```
chat-bot/
├── src/
│   ├── main.py                  # FastAPI app
│   ├── rag_pipeline.py          # RAG logic
│   ├── intent_classifier.py     # Intent detection
│   ├── rules_engine.py          # Rule-based responses
│   └── utils.py
├── knowledge_base/              # Medical documents
│   ├── diseases.txt
│   ├── symptoms.txt
│   └── treatments.txt
├── models/                      # Pre-trained models
└── requirements.txt
```

### 7.5. API Endpoints

#### POST `/chat`
**Request:**
```json
{
  "message": "Tôi bị đau đầu và sốt, nên làm gì?",
  "conversation_id": "uuid",
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "response": "Đau đầu và sốt có thể là triệu chứng của nhiều bệnh...",
  "sources": [
    {
      "content": "...",
      "score": 0.85
    }
  ],
  "intent": "symptom_inquiry"
}
```

### 7.6. Dependencies
```txt
fastapi>=0.68.0
uvicorn>=0.15.0
langchain>=0.1.0
chromadb>=0.4.0
sentence-transformers>=2.2.0
python-dotenv>=0.19.0
```

### 7.7. Knowledge Base Ingestion
```python
# Ingest documents into ChromaDB
from src.rag_pipeline import ingest_data

def ingest_data():
    # Load documents from knowledge_base/
    # Split into chunks
    # Generate embeddings
    # Store in ChromaDB
    pass
```

---

## 8. PREDICTION SERVICE

### 8.1. Tổng Quan
- **Công nghệ**: Python 3.10+, FastAPI, TensorFlow/Keras
- **Port**: 8086
- **Database**: MongoDB (`smart_health_prediction`)
- **ML Model**: Heart disease prediction

### 8.2. Chức Năng Chính
- Dự đoán bệnh tim mạch
- Lưu trữ kết quả dự đoán
- Model inference API
- Feature preprocessing

### 8.3. ML Model
```python
# Model: heart_disease_prediction.h5
# Input features (example):
# - age
# - sex
# - chest_pain_type
# - resting_blood_pressure
# - cholesterol
# - fasting_blood_sugar
# - resting_ecg
# - max_heart_rate
# - exercise_induced_angina
# - oldpeak
# - slope
# - num_major_vessels
# - thalassemia

# Output: Probability of heart disease (0-1)
```

### 8.4. API Endpoints

#### POST `/predict`
**Request:**
```json
{
  "patient_id": "uuid",
  "features": {
    "age": 55,
    "sex": 1,
    "chest_pain_type": 2,
    "resting_blood_pressure": 130,
    "cholesterol": 250,
    "fasting_blood_sugar": 1,
    "resting_ecg": 0,
    "max_heart_rate": 150,
    "exercise_induced_angina": 0,
    "oldpeak": 2.5,
    "slope": 1,
    "num_major_vessels": 0,
    "thalassemia": 2
  }
}
```

**Response:**
```json
{
  "prediction_id": "uuid",
  "patient_id": "uuid",
  "prediction": 0.75,
  "risk_level": "HIGH",
  "recommendation": "Consult a cardiologist immediately",
  "created_at": "2024-01-01T10:00:00Z"
}
```

#### GET `/predictions/:patientId`
- Get prediction history for a patient

### 8.5. Dependencies
```txt
fastapi>=0.68.0
uvicorn>=0.15.0
tensorflow>=2.14.0
numpy==1.26.4
scikit-learn==1.6.1
pymongo>=4.0.0
```

---

## 9. NOTIFICATION SERVICE

### 9.1. Tổng Quan
- **Công nghệ**: NestJS 11, TypeScript
- **Port**: 8088
- **Database**: MySQL (`smart_health_notification`)
- **Integrations**: Firebase FCM, SMTP, Twilio (optional)

### 9.2. Chức Năng Chính
- Email notifications (SMTP)
- Push notifications (Firebase)
- SMS notifications (Twilio - optional)
- Kafka event consumer
- Device token management
- Notification history

### 9.3. Database Schema

#### Entity: `UserDevice`
```typescript
@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'device_token' })
  deviceToken: string;

  @Column({ type: 'enum', enum: DeviceType })
  deviceType: DeviceType;  // IOS, ANDROID, WEB

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt: Date;

  @Index()
  userId: string;
}
```

#### Entity: `Notification`
```typescript
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;
  // APPOINTMENT, MESSAGE, REMINDER, SYSTEM

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### 9.4. Kafka Event Handlers

#### appointment.created
```typescript
{
  eventType: 'appointment.created',
  data: {
    appointmentId: 'uuid',
    patientId: 'uuid',
    doctorId: 'uuid',
    appointmentDate: '2024-01-15',
    startTime: '10:00',
    patientEmail: 'patient@example.com',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith'
  }
}
// → Send confirmation email
// → Send push notification to patient
```

#### appointment.cancelled
#### appointment.reminder (24h before)
#### message.new
#### lab_result.ready

### 9.5. Email Templates
```html
<!-- Appointment Confirmation -->
<h2>Appointment Confirmed</h2>
<p>Dear {{patientName}},</p>
<p>Your appointment has been confirmed:</p>
<ul>
  <li>Doctor: {{doctorName}}</li>
  <li>Date: {{appointmentDate}}</li>
  <li>Time: {{startTime}}</li>
</ul>
<p>Please arrive 10 minutes early.</p>
```

### 9.6. Push Notification
```typescript
// Firebase FCM
const message = {
  notification: {
    title: 'Appointment Reminder',
    body: 'You have an appointment tomorrow at 10:00 AM'
  },
  data: {
    type: 'APPOINTMENT',
    appointmentId: 'uuid'
  },
  token: deviceToken
};

await admin.messaging().send(message);
```

### 9.7. API Endpoints
- POST `/api/notifications/devices` - Register device
- DELETE `/api/notifications/devices/:token` - Unregister
- GET `/api/notifications` - Get user notifications
- PATCH `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/send` - Manual send (admin)

---

## 10. MEDICINE SERVICE

### 10.1. Tổng Quan
- **Công nghệ**: Spring Boot 3.5, Java 17
- **Port**: 8089
- **Database**: MySQL (`smart_health_medicine`)

### 10.2. Chức Năng Chính
- Quản lý danh mục thuốc
- Quản lý kho thuốc
- Kê đơn thuốc
- Lịch sử đơn thuốc
- Tương tác thuốc (drug interactions)

### 10.3. Database Schema

#### Table: `medicines`
```sql
CREATE TABLE medicines (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    manufacturer VARCHAR(255),
    category VARCHAR(100),
    dosage_form VARCHAR(50),  -- Tablet, Capsule, Syrup, etc.
    strength VARCHAR(50),      -- 500mg, 10ml, etc.
    description TEXT,
    usage_instructions TEXT,
    side_effects TEXT,
    contraindications TEXT,
    price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    requires_prescription BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table: `prescriptions`
```sql
CREATE TABLE prescriptions (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    appointment_id CHAR(36),
    medical_record_id CHAR(36),
    issued_date DATE NOT NULL,
    valid_until DATE,
    status ENUM('ACTIVE', 'DISPENSED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `prescription_items`
```sql
CREATE TABLE prescription_items (
    id CHAR(36) PRIMARY KEY,
    prescription_id CHAR(36) NOT NULL,
    medicine_id CHAR(36) NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100),         -- 1 tablet twice daily
    duration_days INT,
    instructions TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);
```

### 10.4. API Endpoints

#### Medicines
- GET `/api/medicines` - List medicines
- GET `/api/medicines/:id`
- POST `/api/medicines` - Create (Admin)
- PUT `/api/medicines/:id` - Update (Admin)
- GET `/api/medicines/search?q=paracetamol`
- GET `/api/medicines/category/:category`

#### Prescriptions
- GET `/api/prescriptions`
- GET `/api/prescriptions/:id`
- POST `/api/prescriptions` - Create prescription
- PUT `/api/prescriptions/:id`
- GET `/api/prescriptions/patient/:patientId`
- GET `/api/prescriptions/doctor/:doctorId`
- PATCH `/api/prescriptions/:id/dispense` - Mark as dispensed

---

## 11. BILLING SERVICE

### 11.1. Tổng Quan
- **Công nghệ**: Spring Boot 3.5, Java 17
- **Port**: 8090
- **Database**: MySQL (`smart_health_billing`)
- **Payment Gateways**: MoMo, VNPay

### 11.2. Chức Năng Chính
- Tạo hóa đơn tự động khi đặt lịch
- Thanh toán qua MoMo
- Thanh toán qua VNPay
- Xử lý IPN (Instant Payment Notification)
- Quản lý giao dịch
- Lịch sử thanh toán
- Hoàn tiền (refund)

### 11.3. Database Schema

#### Table: `invoices`
```sql
CREATE TABLE invoices (
    id CHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    appointment_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL,
    lab_test_fee DECIMAL(10,2) DEFAULT 0,
    medicine_fee DECIMAL(10,2) DEFAULT 0,
    other_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    paid_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table: `payments`
```sql
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    invoice_id CHAR(36) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    payment_method ENUM('MOMO', 'VNPAY', 'CASH', 'BANK_TRANSFER') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
    payment_gateway_response JSON,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

#### Table: `transactions`
```sql
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY,
    payment_id CHAR(36) NOT NULL,
    transaction_type ENUM('PAYMENT', 'REFUND') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);
```

### 11.4. MoMo Integration

#### Create Payment Request
```java
// Endpoint: POST /api/v1/billings/momo/create
{
  "invoiceId": "uuid",
  "amount": 500000,
  "orderInfo": "Thanh toan kham benh",
  "returnUrl": "http://localhost:3000/payment/result",
  "notifyUrl": "http://billing-service:8090/api/v1/billings/ipn/momo"
}

// Response
{
  "payUrl": "https://test-payment.momo.vn/...",
  "qrCodeUrl": "...",
  "deeplink": "..."
}
```

#### IPN Handler
```java
// POST /api/v1/billings/ipn/momo
{
  "partnerCode": "MOMOBKUN20180529",
  "orderId": "uuid",
  "requestId": "uuid",
  "amount": 500000,
  "orderInfo": "...",
  "orderType": "momo_wallet",
  "transId": 123456789,
  "resultCode": 0,  // 0 = Success
  "message": "Successful",
  "payType": "qr",
  "responseTime": 1234567890,
  "extraData": "",
  "signature": "..."
}
```

### 11.5. VNPay Integration

#### Create Payment Request
```java
// Endpoint: POST /api/v1/billings/vnpay/create
{
  "invoiceId": "uuid",
  "amount": 500000,
  "orderInfo": "Thanh toan kham benh",
  "returnUrl": "http://localhost:3000/payment/result"
}

// Response
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

#### Return URL Handler
```java
// GET /api/v1/billings/return?vnp_Amount=50000000&vnp_BankCode=NCB&...
// Verify signature
// Update payment status
// Redirect to frontend with status
```

### 11.6. API Endpoints

#### Invoices
- GET `/api/v1/billings/invoices`
- GET `/api/v1/billings/invoices/:id`
- POST `/api/v1/billings/invoices` - Create invoice
- GET `/api/v1/billings/invoices/appointment/:appointmentId`
- GET `/api/v1/billings/invoices/patient/:patientId`

#### Payments
- POST `/api/v1/billings/momo/create` - Create MoMo payment
- POST `/api/v1/billings/vnpay/create` - Create VNPay payment
- POST `/api/v1/billings/ipn/momo` - MoMo IPN
- POST `/api/v1/billings/ipn/vnpay` - VNPay IPN
- GET `/api/v1/billings/return` - Payment return URL
- GET `/api/v1/billings/payments/:id`
- GET `/api/v1/billings/payments/invoice/:invoiceId`

#### Transactions
- GET `/api/v1/billings/transactions`
- GET `/api/v1/billings/transactions/payment/:paymentId`

### 11.7. Payment Flow
```
1. User books appointment
   ↓
2. Appointment Service → Kafka event
   ↓
3. Billing Service creates invoice
   ↓
4. User initiates payment
   ↓
5. Billing Service calls MoMo/VNPay API
   ↓
6. Return payment URL to user
   ↓
7. User completes payment on gateway
   ↓
8. Gateway sends IPN to Billing Service
   ↓
9. Billing Service verifies signature
   ↓
10. Update payment & invoice status
   ↓
11. Kafka event → Appointment Service
   ↓
12. Update appointment status to CONFIRMED
```

### 11.8. Environment Variables
```env
# MoMo Configuration
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_API_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:8090/api/v1/billings/return
MOMO_IPN_URL=http://billing-service:8090/api/v1/billings/ipn/momo

# VNPay Configuration
VNPAY_TMN_CODE=LKDRSYC0
VNPAY_SECRET_KEY=VLCQ2YMCLUOIQCNOR2YB57J13I9NSWBQ
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8090/api/v1/billings/return
VNPAY_IPN_URL=http://billing-service:8090/api/v1/billings/ipn/vnpay
```

---

## KẾT LUẬN

Tài liệu này cung cấp chi tiết kỹ thuật về 11 backend services trong hệ thống Smart Health. Mỗi service được thiết kế theo nguyên tắc microservices, có database riêng, và giao tiếp với nhau qua Kafka events hoặc REST API.

### Điểm Mạnh Của Kiến Trúc:
1. **Tách biệt rõ ràng**: Mỗi service có trách nhiệm cụ thể
2. **Dễ mở rộng**: Có thể scale từng service độc lập
3. **Công nghệ đa dạng**: Sử dụng công nghệ phù hợp cho từng service
4. **Event-driven**: Giao tiếp bất đồng bộ qua Kafka
5. **Bảo mật tốt**: JWT, API Gateway, internal secrets

### Best Practices Áp Dụng:
- Repository Pattern
- Service Layer Pattern
- DTO Pattern
- Dependency Injection
- Error Handling & Logging
- Input Validation
- Database Indexing
- API Versioning

---

**Phiên bản**: 1.0.0
**Ngày cập nhật**: 2024
**Tác giả**: Smart Health Development Team