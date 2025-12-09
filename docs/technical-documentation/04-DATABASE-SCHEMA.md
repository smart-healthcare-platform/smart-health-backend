# TÀI LIỆU DATABASE SCHEMA

## MỤC LỤC
- [1. TỔNG QUAN DATABASE](#1-tổng-quan-database)
- [2. AUTH SERVICE DATABASE](#2-auth-service-database)
- [3. PATIENT SERVICE DATABASE](#3-patient-service-database)
- [4. DOCTOR SERVICE DATABASE](#4-doctor-service-database)
- [5. APPOINTMENT SERVICE DATABASE](#5-appointment-service-database)
- [6. CHAT SERVICE DATABASE](#6-chat-service-database)
- [7. NOTIFICATION SERVICE DATABASE](#7-notification-service-database)
- [8. MEDICINE SERVICE DATABASE](#8-medicine-service-database)
- [9. BILLING SERVICE DATABASE](#9-billing-service-database)
- [10. PREDICTION SERVICE DATABASE](#10-prediction-service-database)
- [11. RELATIONSHIPS & CONSTRAINTS](#11-relationships--constraints)

---

## 1. TỔNG QUAN DATABASE

### 1.1. Danh Sách Databases

| Database Name | Service | Type | Purpose |
|---------------|---------|------|---------|
| `smart_health_auth` | Auth Service | MySQL | User accounts, authentication |
| `smart_health_patient` | Patient Service | MySQL | Patient information |
| `smart_health_doctor` | Doctor Service | MySQL | Doctor profiles, schedules |
| `smart_health_appointment` | Appointment Service | MySQL | Appointments, medical records |
| `smart_health_chat` | Chat Service | MySQL | Conversations, messages |
| `smart_health_notification` | Notification Service | MySQL | Notifications, devices |
| `smart_health_medicine` | Medicine Service | MySQL | Medicines, prescriptions |
| `smart_health_billing` | Billing Service | MySQL | Invoices, payments |
| `smart_health_prediction` | Prediction Service | MongoDB | Prediction results |
| `chromadb` | Chatbot Service | ChromaDB | Vector embeddings |

### 1.2. Database per Service Pattern

Mỗi microservice có database riêng biệt để:
- **Độc lập**: Service có thể hoạt động độc lập
- **Scalability**: Scale database theo nhu cầu của từng service
- **Technology Freedom**: Chọn database phù hợp (MySQL, MongoDB, ChromaDB)
- **Fault Isolation**: Lỗi ở một database không ảnh hưởng toàn hệ thống

### 1.3. Data Consistency Strategy

- **Event-Driven**: Kafka events để đồng bộ dữ liệu giữa services
- **API Calls**: Internal API cho real-time data
- **Eventual Consistency**: Chấp nhận eventual consistency
- **Saga Pattern**: Distributed transactions (future implementation)

---

## 2. AUTH SERVICE DATABASE

### Database: `smart_health_auth`

### 2.1. Table: `users`

**Mô tả**: Lưu trữ thông tin tài khoản người dùng

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID',
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt hash',
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN', 'RECEPTIONIST') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: UUID, khóa chính
- `username`: Tên đăng nhập duy nhất
- `email`: Email duy nhất
- `password_hash`: Mật khẩu đã hash (BCrypt)
- `role`: Vai trò người dùng
- `is_active`: Trạng thái kích hoạt
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật

**Sample Data**:
```sql
INSERT INTO users VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john_patient', 'john@example.com', 
 '$2a$10$...', 'PATIENT', TRUE, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'dr_smith', 'smith@hospital.com', 
 '$2a$10$...', 'DOCTOR', TRUE, NOW(), NOW());
```

### 2.2. Table: `refresh_tokens`

**Mô tả**: Lưu trữ refresh tokens cho JWT authentication

```sql
CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Columns**:
- `id`: UUID
- `user_id`: Foreign key đến users
- `token`: Refresh token (JWT)
- `expires_at`: Thời gian hết hạn (7 days)
- `revoked`: Token đã bị thu hồi

---

## 3. PATIENT SERVICE DATABASE

### Database: `smart_health_patient`

### 3.1. Table: `patients`

**Mô tả**: Thông tin chi tiết bệnh nhân

```sql
CREATE TABLE patients (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE NOT NULL COMMENT 'Reference to auth.users',
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    blood_type VARCHAR(5) COMMENT 'A+, B+, AB+, O+, A-, B-, AB-, O-',
    height DECIMAL(5,2) COMMENT 'Height in cm',
    weight DECIMAL(5,2) COMMENT 'Weight in kg',
    allergies TEXT COMMENT 'Comma-separated allergies',
    medical_history TEXT,
    emergency_contact VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    insurance_number VARCHAR(50),
    insurance_provider VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_full_name (full_name),
    INDEX idx_phone_number (phone_number),
    INDEX idx_blood_type (blood_type),
    FULLTEXT idx_medical_history (medical_history)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: UUID
- `user_id`: Tham chiếu đến auth service
- `full_name`: Họ tên đầy đủ
- `date_of_birth`: Ngày sinh
- `gender`: Giới tính
- `phone_number`: Số điện thoại
- `address`: Địa chỉ
- `blood_type`: Nhóm máu
- `height`: Chiều cao (cm)
- `weight`: Cân nặng (kg)
- `allergies`: Dị ứng
- `medical_history`: Tiền sử bệnh
- `emergency_contact`: Người liên hệ khẩn cấp
- `insurance_number`: Số bảo hiểm y tế

**Sample Data**:
```sql
INSERT INTO patients VALUES
('patient-001', '550e8400-e29b-41d4-a716-446655440000', 'John Doe', 
 '1990-05-15', 'MALE', '+84901234567', '123 Main St, HCMC', 'A+', 
 175.5, 70.0, 'Penicillin, Peanuts', 'Hypertension (2015)', 
 'Jane Doe', '+84907654321', 'INS123456', 'BHYT Vietnam', NOW(), NOW());
```

---

## 4. DOCTOR SERVICE DATABASE

### Database: `smart_health_doctor`

### 4.1. Table: `doctors`

**Mô tả**: Thông tin bác sĩ

```sql
CREATE TABLE doctors (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE NOT NULL COMMENT 'Reference to auth.users',
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    specialization VARCHAR(100) NOT NULL COMMENT 'Cardiology, Neurology, etc.',
    license_number VARCHAR(50) UNIQUE NOT NULL,
    years_of_experience INT NOT NULL,
    education TEXT COMMENT 'Educational background',
    biography TEXT,
    consultation_fee DECIMAL(10,2) NOT NULL,
    profile_picture VARCHAR(500),
    available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '0.00 to 5.00',
    total_ratings INT DEFAULT 0,
    total_consultations INT DEFAULT 0,
    languages VARCHAR(255) COMMENT 'English, Vietnamese, French',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_specialization (specialization),
    INDEX idx_license_number (license_number),
    INDEX idx_available (available),
    INDEX idx_rating (rating),
    FULLTEXT idx_biography (biography)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
- `id`: UUID
- `user_id`: Reference to auth.users
- `specialization`: Chuyên khoa
- `license_number`: Số chứng chỉ hành nghề
- `years_of_experience`: Số năm kinh nghiệm
- `consultation_fee`: Phí khám
- `rating`: Đánh giá trung bình
- `total_ratings`: Tổng số lượt đánh giá

### 4.2. Table: `doctor_certificates`

**Mô tả**: Bằng cấp và chứng chỉ

```sql
CREATE TABLE doctor_certificates (
    id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_url VARCHAR(500) COMMENT 'URL to certificate file',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3. Table: `doctor_availabilities`

**Mô tả**: Lịch làm việc hàng tuần

```sql
CREATE TABLE doctor_availabilities (
    id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 
                     'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    start_time TIME NOT NULL COMMENT 'e.g., 09:00:00',
    end_time TIME NOT NULL COMMENT 'e.g., 17:00:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_day_of_week (day_of_week),
    UNIQUE KEY unique_doctor_day (doctor_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Sample Data**:
```sql
INSERT INTO doctor_availabilities VALUES
('avail-001', 'doctor-001', 'MONDAY', '09:00:00', '17:00:00', TRUE, NOW(), NOW()),
('avail-002', 'doctor-001', 'TUESDAY', '09:00:00', '17:00:00', TRUE, NOW(), NOW()),
('avail-003', 'doctor-001', 'WEDNESDAY', '09:00:00', '17:00:00', TRUE, NOW(), NOW());
```

### 4.4. Table: `appointment_slots`

**Mô tả**: Khung giờ khám cụ thể

```sql
CREATE TABLE appointment_slots (
    id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_date (date),
    INDEX idx_available (available),
    UNIQUE KEY unique_slot (doctor_id, date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.5. Table: `doctor_block_times`

**Mô tả**: Thời gian nghỉ/không khả dụng

```sql
CREATE TABLE doctor_block_times (
    id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_start_datetime (start_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.6. Table: `doctor_ratings`

**Mô tả**: Đánh giá bác sĩ

```sql
CREATE TABLE doctor_ratings (
    id CHAR(36) PRIMARY KEY,
    doctor_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL COMMENT 'Reference to patient service',
    appointment_id CHAR(36) NOT NULL COMMENT 'Reference to appointment service',
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_appointment_id (appointment_id),
    UNIQUE KEY unique_appointment_rating (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. APPOINTMENT SERVICE DATABASE

### Database: `smart_health_appointment`

### 5.1. Table: `appointments`

**Mô tả**: Lịch hẹn khám bệnh

```sql
CREATE TABLE appointments (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL COMMENT 'Reference to patient service',
    doctor_id CHAR(36) NOT NULL COMMENT 'Reference to doctor service',
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 
                'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING',
    appointment_type ENUM('CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 
                          'ROUTINE_CHECKUP') DEFAULT 'CONSULTATION',
    reason TEXT,
    notes TEXT,
    checked_in_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    google_event_id VARCHAR(255) COMMENT 'Google Calendar event ID',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX composite_doctor_date (doctor_id, appointment_date),
    INDEX composite_patient_date (patient_id, appointment_date),
    INDEX composite_date_status (appointment_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Status Flow**:
```
PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED
                   ↘ CANCELLED
                   ↘ NO_SHOW
```

### 5.2. Table: `medical_records`

**Mô tả**: Hồ sơ y tế/bệnh án

```sql
CREATE TABLE medical_records (
    id CHAR(36) PRIMARY KEY,
    appointment_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    chief_complaint TEXT COMMENT 'Lý do khám chính',
    present_illness TEXT COMMENT 'Bệnh sử',
    physical_examination TEXT COMMENT 'Khám lâm sàng',
    diagnosis TEXT NOT NULL COMMENT 'Chẩn đoán',
    treatment_plan TEXT,
    prescription TEXT COMMENT 'Đơn thuốc (legacy, use prescription table)',
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_diagnosis (diagnosis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.3. Table: `vital_signs`

**Mô tả**: Chỉ số sinh tồn

```sql
CREATE TABLE vital_signs (
    id CHAR(36) PRIMARY KEY,
    appointment_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    temperature DECIMAL(4,1) COMMENT 'Celsius (36.5)',
    blood_pressure_systolic INT COMMENT 'mmHg (120)',
    blood_pressure_diastolic INT COMMENT 'mmHg (80)',
    heart_rate INT COMMENT 'beats per minute',
    respiratory_rate INT COMMENT 'breaths per minute',
    oxygen_saturation INT COMMENT 'SpO2 percentage (98)',
    weight DECIMAL(5,2) COMMENT 'kg',
    height DECIMAL(5,2) COMMENT 'cm',
    bmi DECIMAL(4,2) COMMENT 'Calculated BMI',
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by CHAR(36) COMMENT 'User ID who recorded',
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.4. Table: `lab_tests`

**Mô tả**: Danh mục xét nghiệm

```sql
CREATE TABLE lab_tests (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type ENUM('BLOOD', 'URINE', 'IMAGING', 'BIOPSY', 'MICROBIOLOGY', 
                   'PATHOLOGY', 'OTHER') NOT NULL,
    category VARCHAR(100) COMMENT 'Hematology, Chemistry, etc.',
    price DECIMAL(10,2),
    turnaround_time INT COMMENT 'Hours to get results',
    preparation_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_test_type (test_type),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.5. Table: `lab_test_orders`

**Mô tả**: Yêu cầu xét nghiệm

```sql
CREATE TABLE lab_test_orders (
    id CHAR(36) PRIMARY KEY,
    appointment_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    lab_test_id CHAR(36) NOT NULL,
    status ENUM('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 
                'COMPLETED', 'CANCELLED') DEFAULT 'ORDERED',
    priority ENUM('ROUTINE', 'URGENT', 'STAT') DEFAULT 'ROUTINE',
    notes TEXT,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sample_collected_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status),
    INDEX idx_ordered_at (ordered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.6. Table: `lab_test_results`

**Mô tả**: Kết quả xét nghiệm

```sql
CREATE TABLE lab_test_results (
    id CHAR(36) PRIMARY KEY,
    lab_test_order_id CHAR(36) NOT NULL,
    result_value TEXT NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100) COMMENT 'e.g., 3.5-5.0',
    status ENUM('NORMAL', 'ABNORMAL', 'CRITICAL') NOT NULL,
    interpretation TEXT,
    result_file_url VARCHAR(500) COMMENT 'URL to PDF/image result',
    verified_by CHAR(36) COMMENT 'Lab technician/doctor who verified',
    resulted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lab_test_order_id) REFERENCES lab_test_orders(id) ON DELETE CASCADE,
    INDEX idx_lab_test_order_id (lab_test_order_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_result_per_order (lab_test_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5.7. Table: `follow_up_suggestions`

**Mô tả**: Đề xuất tái khám

```sql
CREATE TABLE follow_up_suggestions (
    id CHAR(36) PRIMARY KEY,
    appointment_id CHAR(36) NOT NULL,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    suggested_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'SCHEDULED', 'COMPLETED', 'DECLINED') DEFAULT 'PENDING',
    new_appointment_id CHAR(36) COMMENT 'If scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. CHAT SERVICE DATABASE

### Database: `smart_health_chat`

### 6.1. Table: `conversations`

**Mô tả**: Cuộc hội thoại giữa bác sĩ và bệnh nhân

```sql
CREATE TABLE conversations (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    last_message_id CHAR(36),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_last_message_at (last_message_at),
    UNIQUE KEY unique_conversation (patient_id, doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6.2. Table: `messages`

**Mô tả**: Tin nhắn

```sql
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY,
    conversation_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL COMMENT 'User ID (from auth service)',
    sender_type ENUM('PATIENT', 'DOCTOR') NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'FILE', 'AUDIO') DEFAULT 'TEXT',
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT COMMENT 'Bytes',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.3. Table: `message_attachments`

**Mô tả**: File đính kèm (nếu cần tách riêng)

```sql
CREATE TABLE message_attachments (
    id CHAR(36) PRIMARY KEY,
    message_id CHAR(36) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 7. NOTIFICATION SERVICE DATABASE

### Database: `smart_health_notification`

### 7.1. Table: `user_devices`

**Mô tả**: Thiết bị của người dùng (cho push notifications)

```sql
CREATE TABLE user_devices (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    device_token VARCHAR(500) NOT NULL COMMENT 'FCM token',
    device_type ENUM('IOS', 'ANDROID', 'WEB') NOT NULL,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_device_token (device_token(255)),
    INDEX idx_is_active (is_active),
    UNIQUE KEY unique_device_token (device_token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.2. Table: `notifications`

**Mô tả**: Lịch sử thông báo

```sql
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type ENUM('APPOINTMENT', 'MESSAGE', 'REMINDER', 'LAB_RESULT', 
                           'PAYMENT', 'SYSTEM') NOT NULL,
    data JSON COMMENT 'Additional data',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    sent_via ENUM('PUSH', 'EMAIL', 'SMS') DEFAULT 'PUSH',
    delivery_status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.3. Table: `email_logs`

**Mô tả**: Log email đã gửi

```sql
CREATE TABLE email_logs (
    id CHAR(36) PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100),
    status ENUM('SENT', 'FAILED', 'BOUNCED') NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 8. MEDICINE SERVICE DATABASE

### Database: `smart_health_medicine`

### 8.1. Table: `medicines`

**Mô tả**: Danh mục thuốc

```sql
CREATE TABLE medicines (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    manufacturer VARCHAR(255),
    category VARCHAR(100) COMMENT 'Antibiotic, Analgesic, etc.',
    dosage_form ENUM('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 
                     'CREAM', 'OINTMENT', 'DROPS', 'INHALER') NOT NULL,
    strength VARCHAR(50) COMMENT '500mg, 10ml, etc.',
    description TEXT,
    usage_instructions TEXT,
    side_effects TEXT,
    contraindications TEXT,
    interactions TEXT COMMENT 'Drug interactions',
    storage_conditions VARCHAR(255),
    price DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    requires_prescription BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_generic_name (generic_name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    FULLTEXT idx_search (name, generic_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.2. Table: `prescriptions`

**Mô tả**: Đơn thuốc

```sql
CREATE TABLE prescriptions (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    appointment_id CHAR(36),
    medical_record_id CHAR(36),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date DATE NOT NULL,
    valid_until DATE,
    status ENUM('ACTIVE', 'DISPENSED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_status (status),
    INDEX idx_prescription_number (prescription_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.3. Table: `prescription_items`

**Mô tả**: Chi tiết đơn thuốc

```sql
CREATE TABLE prescription_items (
    id CHAR(36) PRIMARY KEY,
    prescription_id CHAR(36) NOT NULL,
    medicine_id CHAR(36) NOT NULL,
    quantity INT NOT NULL,
    dosage VARCHAR(100) NOT NULL COMMENT '1 tablet twice daily',
    duration_days INT COMMENT 'Number of days',
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    INDEX idx_prescription_id (prescription_id),
    INDEX idx_medicine_id (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 8.4. Table: `medicine_inventory`

**Mô tả**: Quản lý kho thuốc

```sql
CREATE TABLE medicine_inventory (
    id CHAR(36) PRIMARY KEY,
    medicine_id CHAR(36) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    location VARCHAR(100),
    received_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    INDEX idx_medicine_id (medicine_id),
    INDEX idx_expiry_date (expiry_date),
    UNIQUE KEY unique_batch (medicine_id, batch_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 9. BILLING SERVICE DATABASE

### Database: `smart_health_billing`

### 9.1. Table: `invoices`

**Mô tả**: Hóa đơn

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
    other_fees DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 
                'REFUNDED', 'OVERDUE') DEFAULT 'PENDING',
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    paid_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status),
    INDEX idx_issued_date (issued_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9.2. Table: `payments`

**Mô tả**: Thanh toán

```sql
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    invoice_id CHAR(36) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    payment_method ENUM('MOMO', 'VNPAY', 'CASH', 'BANK_TRANSFER', 
                        'CREDIT_CARD', 'DEBIT_CARD') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 
                'REFUNDED', 'PROCESSING') DEFAULT 'PENDING',
    payment_gateway_response JSON,
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    payer_phone VARCHAR(20),
    paid_at TIMESTAMP NULL,
    refund_reason TEXT,
    refunded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status),
    INDEX idx_payment_method (payment_method),
    INDEX idx_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9.3. Table: `transactions`

**Mô tả**: Lịch sử giao dịch

```sql
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY,
    payment_id CHAR(36) NOT NULL,
    transaction_type ENUM('PAYMENT', 'REFUND', 'ADJUSTMENT') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    processed_by CHAR(36) COMMENT 'User ID who processed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9.4. Table: `payment_gateway_logs`

**Mô tả**: Log giao dịch với payment gateway

```sql
CREATE TABLE payment_gateway_logs (
    id CHAR(36) PRIMARY KEY,
    payment_id CHAR(36) NOT NULL,
    gateway ENUM('MOMO', 'VNPAY') NOT NULL,
    request_data JSON,
    response_data JSON,
    status_code INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_gateway (gateway),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 10. PREDICTION SERVICE DATABASE

### Database: `smart_health_prediction` (MongoDB)

### 10.1. Collection: `predictions`

**Mô tả**: Kết quả dự đoán bệnh

```javascript
{
    _id: ObjectId("..."),
    predictionId: "uuid",
    patientId: "uuid",
    modelName: "heart_disease_prediction",
    modelVersion: "1.0.0",
    features: {
        age: 55,
        sex: 1,
        chestPainType: 2,
        restingBloodPressure: 130,
        cholesterol: 250,
        fastingBloodSugar: 1,
        restingECG: 0,
        maxHeartRate: 150,
        exerciseInducedAngina: 0,
        oldpeak: 2.5,
        slope: 1,
        numMajorVessels: 0,
        thalassemia: 2
    },
    prediction: 0.75,
    riskLevel: "HIGH", // LOW, MEDIUM, HIGH, CRITICAL
    confidence: 0.85,
    recommendation: "Consult a cardiologist immediately",
    additionalInfo: {
        riskFactors: ["High cholesterol", "Hypertension"],
        preventiveMeasures: ["Diet control", "Regular exercise"]
    },
    createdAt: ISODate("2024-01-01T10:00:00Z"),
    updatedAt: ISODate("2024-01-01T10:00:00Z")
}
```

**Indexes**:
```javascript
db.predictions.createIndex({ patientId: 1 })
db.predictions.createIndex({ createdAt: -1 })
db.predictions.createIndex({ riskLevel: 1 })
db.predictions.createIndex({ "features.age": 1 })
```

### 10.2. Collection: `prediction_history`

**Mô tả**: Lịch sử dự đoán theo thời gian

```javascript
{
    _id: ObjectId("..."),
    patientId: "uuid",
    predictions: [
        {
            predictionId: "uuid",
            prediction: 0.75,
            riskLevel: "HIGH",
            createdAt: ISODate("2024-01-01T10:00:00Z")
        },
        {
            predictionId: "uuid",
            prediction: 0.65,
            riskLevel: "MEDIUM",
            createdAt: ISODate("2024-02-01T10:00:00Z")
        }
    ],
    lastUpdated: ISODate("2024-02-01T10:00:00Z")
}
```

---

## 11. RELATIONSHIPS & CONSTRAINTS

### 11.1. Cross-Service References

**Lưu ý**: Do mỗi service có database riêng, không thể sử dụng foreign key constraints giữa các database. Phải đảm bảo referential integrity thông qua application logic.

#### User References
```
auth.users.id
    ↓
patient.patients.user_id
doctor.doctors.user_id
```

#### Appointment Flow
```
patient.patients.id ─┐
doctor.doctors.id ───┼─→ appointment.appointments
                     │   └─→ appointment.medical_records
                     │   └─→ appointment.vital_signs
                     │   └─→ appointment.lab_test_orders
                     │
                     └─→ billing.invoices
                         └─→ billing.payments
```

### 11.2. Data Consistency Strategies

#### 11.2.1. Eventual Consistency via Kafka
```
User Created Event (auth service)
    ↓ Kafka
Patient Service → Create patient profile
Doctor Service → Create doctor profile (if role = DOCTOR)
Notification Service → Send welcome email
```

#### 11.2.2. API-based Validation
```
Appointment Service → GET /api/doctors/{id} → Doctor Service
                   → GET /api/patients/{id} → Patient Service
                   ↓ Validate before creating appointment
```

#### 11.2.3. Saga Pattern (Future)
```
Create Appointment Saga:
1. Reserve appointment slot (Doctor Service)
2. Create appointment (Appointment Service)
3. Create invoice (Billing Service)
4. Send notification (Notification Service)

If any step fails → Rollback previous steps
```

### 11.3. Database Indexing Strategy

#### High-Priority Indexes
```sql
-- Frequently queried fields
INDEX on user_id, patient_id, doctor_id
INDEX on appointment_date, created_at
INDEX on status fields

-- Composite indexes for common queries
INDEX (doctor_id, appointment_date, status)
INDEX (patient_id, created_at DESC)

-- Unique constraints
UNIQUE (username), (email)
UNIQUE (doctor_id, date, start_time)
```

#### Fulltext Indexes
```sql
FULLTEXT INDEX on medical_records.diagnosis
FULLTEXT INDEX on doctors.biography
FULLTEXT INDEX on medicines.name, generic_name
```

### 11.4. Database Optimization

#### Connection Pooling
```
Min connections: 5
Max connections: 20
Idle timeout: 30 seconds
```

#### Query Optimization
- Use prepared statements
- Avoid N+1 queries
- Pagination for large datasets
- Eager loading for related data

#### Backup Strategy
- Daily full backups
- Hourly incremental backups
- Retention: 30 days
- Cross-region replication for production

---

## KẾT LUẬN

### Tổng Kết Database Schema

1. **Tổng số databases**: 9 (MySQL) + 1 (MongoDB) + 1 (ChromaDB)
2. **Tổng số tables**: ~40 tables
3. **Kiến trúc**: Database per Service
4. **Consistency**: Eventual consistency via Kafka events

### Ưu Điểm Kiến Trúc Database

✅ **Tách biệt rõ ràng**: Mỗi service độc lập về database
✅ **Scalability**: Scale database theo nhu cầu từng service
✅ **Fault Isolation**: Lỗi database không lan rộng
✅ **Technology Freedom**: MySQL, MongoDB, ChromaDB theo nhu cầu
✅ **Performance**: Indexes được tối ưu cho từng use case

### Thách Thức & Giải Pháp

❌ **No Foreign Keys across services**
✅ Giải pháp: Application-level validation, Kafka events

❌ **Data Duplication** (user_id, patient_id)
✅ Giải pháp: Cache, eventual consistency

❌ **Complex Queries** across services
✅ Giải pháp: API composition, CQRS pattern (future)

❌ **Distributed Transactions**
✅ Giải pháp: Saga pattern, compensating transactions

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 2024  
**Tác giả**: Smart Health Database Team