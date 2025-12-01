# TÀI LIỆU API DOCUMENTATION

## MỤC LỤC
- [1. TỔNG QUAN API](#1-tổng-quan-api)
- [2. AUTHENTICATION APIs](#2-authentication-apis)
- [3. PATIENT APIs](#3-patient-apis)
- [4. DOCTOR APIs](#4-doctor-apis)
- [5. APPOINTMENT APIs](#5-appointment-apis)
- [6. CHAT APIs](#6-chat-apis)
- [7. NOTIFICATION APIs](#7-notification-apis)
- [8. MEDICINE APIs](#8-medicine-apis)
- [9. BILLING APIs](#9-billing-apis)
- [10. PREDICTION APIs](#10-prediction-apis)
- [11. CHATBOT APIs](#11-chatbot-apis)

---

## 1. TỔNG QUAN API

### 1.1. Base URL

```
Development: http://localhost:8080
Production: https://api.smarthealth.com
```

### 1.2. API Gateway

Tất cả requests đều đi qua API Gateway (port 8080) và được forward đến các microservices tương ứng.

### 1.3. Authentication

Sử dụng JWT Bearer Token trong header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.4. Response Format

#### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 1.5. HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Request successful, no response body |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### 1.6. Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (e.g., `createdAt:desc`)

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 2. AUTHENTICATION APIs

### 2.1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Đăng ký tài khoản mới

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "PATIENT"
}
```

**Validation:**
- `username`: Required, min 3 chars, max 50 chars, alphanumeric
- `email`: Required, valid email format
- `password`: Required, min 8 chars, must contain uppercase, lowercase, number, special char
- `role`: Required, enum: PATIENT, DOCTOR, ADMIN, RECEPTIONIST

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "PATIENT",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

**Errors:**
- `409 Conflict`: Username or email already exists
- `400 Bad Request`: Invalid input data

---

### 2.2. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Đăng nhập và nhận JWT tokens

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "PATIENT"
    }
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive

---

### 2.3. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Description:** Làm mới access token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400000
  }
}
```

---

### 2.4. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Đăng xuất và revoke refresh token

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### 2.5. Get Current User

**Endpoint:** `GET /api/users/me`

**Description:** Lấy thông tin user hiện tại

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "PATIENT",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

---

## 3. PATIENT APIs

### 3.1. Get All Patients

**Endpoint:** `GET /api/patients`

**Description:** Lấy danh sách bệnh nhân (Admin, Doctor, Receptionist)

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name, phone
- `gender`: Filter by gender (MALE, FEMALE, OTHER)
- `bloodType`: Filter by blood type
- `sort`: Sort field (e.g., `fullName:asc`)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "patient-001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "fullName": "John Doe",
        "dateOfBirth": "1990-05-15",
        "gender": "MALE",
        "phoneNumber": "+84901234567",
        "email": "john@example.com",
        "bloodType": "A+",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 3.2. Get Patient by ID

**Endpoint:** `GET /api/patients/{id}`

**Description:** Lấy thông tin chi tiết bệnh nhân

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "patient-001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "phoneNumber": "+84901234567",
    "address": "123 Main St, HCMC",
    "email": "john@example.com",
    "bloodType": "A+",
    "height": 175.5,
    "weight": 70.0,
    "allergies": "Penicillin, Peanuts",
    "medicalHistory": "Hypertension (2015)",
    "emergencyContact": "Jane Doe",
    "emergencyContactPhone": "+84907654321",
    "insuranceNumber": "INS123456",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Errors:**
- `404 Not Found`: Patient not found

---

### 3.3. Create Patient

**Endpoint:** `POST /api/patients`

**Description:** Tạo hồ sơ bệnh nhân mới

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "John Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "phoneNumber": "+84901234567",
  "address": "123 Main St, HCMC",
  "bloodType": "A+",
  "height": 175.5,
  "weight": 70.0,
  "allergies": "Penicillin",
  "emergencyContact": "Jane Doe",
  "emergencyContactPhone": "+84907654321"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "Patient created successfully",
  "data": { ... }
}
```

---

### 3.4. Update Patient

**Endpoint:** `PUT /api/patients/{id}`

**Description:** Cập nhật thông tin bệnh nhân

**Headers:** `Authorization: Bearer {token}`

**Request Body:** (Partial update supported)
```json
{
  "phoneNumber": "+84901234999",
  "address": "456 New St, HCMC",
  "weight": 72.0
}
```

**Response:** `200 OK`

---

### 3.5. Delete Patient

**Endpoint:** `DELETE /api/patients/{id}`

**Description:** Xóa bệnh nhân (Admin only)

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## 4. DOCTOR APIs

### 4.1. Get All Doctors

**Endpoint:** `GET /api/doctors`

**Description:** Lấy danh sách bác sĩ

**Query Parameters:**
- `page`, `limit`, `sort`
- `specialization`: Filter by specialization
- `available`: Filter by availability (true/false)
- `minRating`: Minimum rating (0-5)
- `search`: Search by name

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "doctor-001",
        "fullName": "Dr. Sarah Smith",
        "specialization": "Cardiology",
        "licenseNumber": "LIC123456",
        "yearsOfExperience": 15,
        "consultationFee": 500000,
        "rating": 4.8,
        "totalRatings": 120,
        "available": true,
        "profilePicture": "https://...",
        "languages": "English, Vietnamese"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 4.2. Get Doctor by ID

**Endpoint:** `GET /api/doctors/{id}`

**Description:** Lấy thông tin chi tiết bác sĩ

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "doctor-001",
    "fullName": "Dr. Sarah Smith",
    "dateOfBirth": "1980-03-20",
    "gender": "FEMALE",
    "phoneNumber": "+84909876543",
    "email": "sarah.smith@hospital.com",
    "specialization": "Cardiology",
    "licenseNumber": "LIC123456",
    "yearsOfExperience": 15,
    "education": "MD from Harvard Medical School",
    "biography": "Experienced cardiologist specializing in...",
    "consultationFee": 500000,
    "rating": 4.8,
    "totalRatings": 120,
    "totalConsultations": 500,
    "languages": "English, Vietnamese",
    "available": true,
    "certificates": [
      {
        "certificateName": "Board Certified Cardiologist",
        "issuingOrganization": "American Board of Internal Medicine",
        "issueDate": "2010-06-15"
      }
    ],
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### 4.3. Get Doctor Availability

**Endpoint:** `GET /api/doctors/{doctorId}/availability`

**Description:** Lấy lịch làm việc của bác sĩ

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isActive": true
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isActive": true
    }
  ]
}
```

---

### 4.4. Get Doctor Appointment Slots

**Endpoint:** `GET /api/doctors/appointment-slots/doctor/{doctorId}`

**Description:** Lấy các khung giờ khám khả dụng

**Query Parameters:**
- `date`: Specific date (YYYY-MM-DD)
- `startDate`: Start date range
- `endDate`: End date range
- `available`: Filter by availability (default: true)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "slot-001",
      "doctorId": "doctor-001",
      "date": "2024-01-15",
      "startTime": "09:00:00",
      "endTime": "09:30:00",
      "available": true
    },
    {
      "id": "slot-002",
      "doctorId": "doctor-001",
      "date": "2024-01-15",
      "startTime": "09:30:00",
      "endTime": "10:00:00",
      "available": false
    }
  ]
}
```

---

### 4.5. Create Appointment Slots

**Endpoint:** `POST /api/doctors/appointment-slots`

**Description:** Tạo khung giờ khám (Doctor only)

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "doctorId": "doctor-001",
  "date": "2024-01-15",
  "slots": [
    {
      "startTime": "09:00:00",
      "endTime": "09:30:00"
    },
    {
      "startTime": "09:30:00",
      "endTime": "10:00:00"
    }
  ]
}
```

**Response:** `201 Created`

---

### 4.6. Get Doctor Ratings

**Endpoint:** `GET /api/doctors/{doctorId}/ratings`

**Description:** Lấy đánh giá của bác sĩ

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "averageRating": 4.8,
    "totalRatings": 120,
    "ratings": [
      {
        "id": "rating-001",
        "patientId": "patient-001",
        "patientName": "John Doe",
        "rating": 5,
        "review": "Excellent doctor, very professional",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.7. Create Doctor Rating

**Endpoint:** `POST /api/doctors/{doctorId}/ratings`

**Description:** Đánh giá bác sĩ (Patient only, sau khi hoàn thành appointment)

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "appointmentId": "appointment-001",
  "rating": 5,
  "review": "Excellent doctor, very professional"
}
```

**Response:** `201 Created`

---

## 5. APPOINTMENT APIs

### 5.1. Get All Appointments

**Endpoint:** `GET /api/appointments`

**Description:** Lấy danh sách appointments

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`, `limit`, `sort`
- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `status`: Filter by status (PENDING, CONFIRMED, COMPLETED, etc.)
- `date`: Filter by specific date
- `startDate`, `endDate`: Date range

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "appointment-001",
        "patientId": "patient-001",
        "patientName": "John Doe",
        "doctorId": "doctor-001",
        "doctorName": "Dr. Sarah Smith",
        "appointmentDate": "2024-01-15",
        "startTime": "09:00:00",
        "endTime": "09:30:00",
        "status": "CONFIRMED",
        "appointmentType": "CONSULTATION",
        "reason": "Annual checkup",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 5.2. Get Appointment by ID

**Endpoint:** `GET /api/appointments/{id}`

**Description:** Lấy chi tiết appointment

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "appointment-001",
    "patient": {
      "id": "patient-001",
      "fullName": "John Doe",
      "phoneNumber": "+84901234567",
      "email": "john@example.com"
    },
    "doctor": {
      "id": "doctor-001",
      "fullName": "Dr. Sarah Smith",
      "specialization": "Cardiology",
      "consultationFee": 500000
    },
    "appointmentDate": "2024-01-15",
    "startTime": "09:00:00",
    "endTime": "09:30:00",
    "status": "CONFIRMED",
    "appointmentType": "CONSULTATION",
    "reason": "Annual checkup",
    "notes": "Patient has history of hypertension",
    "checkedInAt": null,
    "completedAt": null,
    "googleEventId": "google-event-123",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### 5.3. Create Appointment

**Endpoint:** `POST /api/appointments`

**Description:** Đặt lịch khám

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "patientId": "patient-001",
  "doctorId": "doctor-001",
  "appointmentDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "09:30:00",
  "appointmentType": "CONSULTATION",
  "reason": "Annual checkup",
  "notes": "Patient prefers morning appointments"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "Appointment created successfully",
  "data": {
    "id": "appointment-001",
    "status": "PENDING",
    ...
  }
}
```

**Business Logic:**
1. Check doctor availability
2. Check slot availability
3. Create appointment (status: PENDING)
4. Mark slot as unavailable
5. Create Google Calendar event
6. Create invoice (Billing service)
7. Send Kafka event
8. Send confirmation email

**Errors:**
- `409 Conflict`: Time slot not available
- `400 Bad Request`: Invalid date/time

---

### 5.4. Update Appointment Status

**Endpoint:** `PATCH /api/appointments/{id}/status`

**Description:** Cập nhật trạng thái appointment

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "notes": "Confirmed by receptionist"
}
```

**Response:** `200 OK`

---

### 5.5. Cancel Appointment

**Endpoint:** `DELETE /api/appointments/{id}`

**Description:** Hủy appointment

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `reason`: Cancellation reason (optional)

**Response:** `200 OK`

**Business Logic:**
1. Update status to CANCELLED
2. Release appointment slot
3. Delete Google Calendar event
4. Cancel/refund invoice
5. Send notification

---

### 5.6. Check-in Patient (Receptionist)

**Endpoint:** `PATCH /api/appointments/receptionist/{id}/check-in`

**Description:** Check-in bệnh nhân khi đến khám (Receptionist only)

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Patient checked in successfully",
  "data": {
    "id": "appointment-001",
    "status": "CHECKED_IN",
    "checkedInAt": "2024-01-15T09:00:00Z"
  }
}
```

---

### 5.7. Get Today's Appointments (Receptionist)

**Endpoint:** `GET /api/appointments/receptionist/today`

**Description:** Lấy danh sách appointments hôm nay

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

### 5.8. Create Medical Record

**Endpoint:** `POST /api/appointments/medical-records`

**Description:** Tạo hồ sơ y tế sau khi khám (Doctor only)

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "appointmentId": "appointment-001",
  "patientId": "patient-001",
  "chiefComplaint": "Headache and fever",
  "presentIllness": "Patient reports headache for 3 days",
  "physicalExamination": "Temperature: 38.5°C, BP: 120/80",
  "diagnosis": "Viral infection",
  "treatmentPlan": "Rest, hydration, paracetamol",
  "notes": "Follow up in 1 week if symptoms persist",
  "followUpRequired": true,
  "followUpDate": "2024-01-22"
}
```

**Response:** `201 Created`

---

### 5.9. Get Medical Records

**Endpoint:** `GET /api/appointments/medical-records/patient/{patientId}`

**Description:** Lấy lịch sử khám bệnh của bệnh nhân

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "record-001",
      "appointmentId": "appointment-001",
      "doctorName": "Dr. Sarah Smith",
      "appointmentDate": "2024-01-15",
      "diagnosis": "Viral infection",
      "treatment": "Rest, hydration",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### 5.10. Record Vital Signs

**Endpoint:** `POST /api/appointments/vital-signs`

**Description:** Ghi nhận chỉ số sinh tồn (Nurse/Doctor)

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "appointmentId": "appointment-001",
  "patientId": "patient-001",
  "temperature": 36.5,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 75,
  "respiratoryRate": 16,
  "oxygenSaturation": 98,
  "weight": 70.5,
  "height": 175.5,
  "notes": "All vital signs normal"
}
```

**Response:** `201 Created`

---

### 5.11. Lab Test APIs

#### Order Lab Test
**Endpoint:** `POST /api/appointments/lab-test-orders`

**Request Body:**
```json
{
  "appointmentId": "appointment-001",
  "patientId": "patient-001",
  "doctorId": "doctor-001",
  "labTestId": "test-001",
  "priority": "ROUTINE",
  "notes": "Fasting required"
}
```

#### Get Lab Test Results
**Endpoint:** `GET /api/appointments/lab-test-results/{orderId}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "result-001",
    "labTestOrderId": "order-001",
    "testName": "Complete Blood Count",
    "resultValue": "Normal",
    "status": "NORMAL",
    "resultFileUrl": "https://...",
    "resultedAt": "2024-01-16T10:00:00Z"
  }
}
```

---

## 6. CHAT APIs

### 6.1. Get Conversations

**Endpoint:** `GET /api/chat/conversations`

**Description:** Lấy danh sách conversations của user

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "conv-001",
      "patientId": "patient-001",
      "patientName": "John Doe",
      "doctorId": "doctor-001",
      "doctorName": "Dr. Sarah Smith",
      "lastMessage": {
        "content": "Thank you, doctor!",
        "createdAt": "2024-01-15T14:30:00Z"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

### 6.2. Get Messages

**Endpoint:** `GET /api/chat/conversations/{conversationId}/messages`

**Description:** Lấy tin nhắn trong conversation

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`, `limit`
- `before`: Get messages before timestamp
- `after`: Get messages after timestamp

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "msg-001",
        "conversationId": "conv-001",
        "senderId": "patient-001",
        "senderType": "PATIENT",
        "content": "Hello doctor, I have a question",
        "messageType": "TEXT",
        "isRead": true,
        "createdAt": "2024-01-15T14:00:00Z"
      },
      {
        "id": "msg-002",
        "conversationId": "conv-001",
        "senderId": "doctor-001",
        "senderType": "DOCTOR",
        "content": "Hello, how can I help you?",
        "messageType": "TEXT",
        "isRead": true,
        "createdAt": "2024-01-15T14:05:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6.3. Socket.IO Events

#### Connect
```javascript
const socket = io('http://localhost:8085', {
  auth: { token: accessToken }
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  conversationId: 'conv-001',
  content: 'Hello doctor',
  messageType: 'TEXT'
});
```

#### Receive Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### Typing Indicator
```javascript
socket.emit('typing', { conversationId: 'conv-001' });

socket.on('user_typing', ({ userId, conversationId }) => {
  console.log('User is typing...');
});
```

#### Mark as Read
```javascript
socket.emit('mark_read', { messageId: 'msg-001' });
```

---

## 7. NOTIFICATION APIs

### 7.1. Register Device

**Endpoint:** `POST /api/notifications/devices`

**Description:** Đăng ký device token cho push notifications

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "deviceToken": "firebase-token-...",
  "deviceType": "IOS",
  "deviceName": "iPhone 14 Pro"
}
```

**Response:** `201 Created`

---

### 7.2. Get Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Lấy danh sách notifications của user

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`, `limit`
- `isRead`: Filter by read status
- `type`: Filter by notification type

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "notif-001",
        "title": "Appointment Reminder",
        "body": "You have an appointment tomorrow at 9:00 AM",
        "type": "APPOINTMENT",
        "data": {
          "appointmentId": "appointment-001"
        },
        "isRead": false,
        "createdAt": "2024-01-14T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 7.3. Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/{id}/read`

**Description:** Đánh dấu đã đọc

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

## 8. MEDICINE APIs

### 8.1. Get Medicines

**Endpoint:** `GET /api/medicines`

**Description:** Lấy danh sách thuốc

**Query Parameters:**
- `search`: Search by name, generic name
- `category`: Filter by category
- `dosageForm`: Filter by dosage form
- `requiresPrescription`: Filter (true/false)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "med-001",
        "name": "Paracetamol",
        "genericName": "Acetaminophen",
        "manufacturer": "ABC Pharma",
        "category": "Analgesic",
        "dosageForm": "TABLET",
        "strength": "500mg",
        "price": 5000,
        "stockQuantity": 1000,
        "requiresPrescription": false
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 8.2. Get Medicine by ID

**Endpoint:** `GET /api/medicines/{id}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "med-001",
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "manufacturer": "ABC Pharma",
    "category": "Analgesic",
    "dosageForm": "TABLET",
    "strength": "500mg",
    "description": "Pain reliever and fever reducer",
    "usageInstructions": "Take 1-2 tablets every 4-6 hours",
    "sideEffects": "Rare: nausea, skin rash",
    "contraindications": "Liver disease",
    "price": 5000,
    "stockQuantity": 1000,
    "requiresPrescription": false
  }
}
```

---

### 8.3. Create Prescription

**Endpoint:** `POST /api/prescriptions`

**Description:** Kê đơn thuốc (Doctor only)

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "patientId": "patient-001",
  "appointmentId": "appointment-001",
  "medicalRecordId": "record-001",
  "issuedDate": "2024-01-15",
  "validUntil": "2024-02-15",
  "notes": "Take with food",
  "items": [
    {
      "medicineId": "med-001",
      "quantity": 30,
      "dosage": "1 tablet twice daily",
      "durationDays": 15,
      "instructions": "Take after meals"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "pres-001",
    "prescriptionNumber": "RX20240115001",
    "status": "ACTIVE",
    ...
  }
}
```

---

### 8.4. Get Prescriptions

**Endpoint:** `GET /api/prescriptions/patient/{patientId}`

**Description:** Lấy danh sách đơn thuốc của bệnh nhân

**Response:** `200 OK`

---

## 9. BILLING APIs

### 9.1. Get Invoices

**Endpoint:** `GET /api/v1/billings/invoices`

**Description:** Lấy danh sách hóa đơn

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `patientId`: Filter by patient
- `status`: Filter by status
- `startDate`, `endDate`: Date range

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "invoice-001",
        "invoiceNumber": "INV20240115001",
        "appointmentId": "appointment-001",
        "patientId": "patient-001",
        "patientName": "John Doe",
        "consultationFee": 500000,
        "labTestFee": 200000,
        "medicineFee": 100000,
        "subtotal": 800000,
        "tax": 0,
        "discount": 0,
        "totalAmount": 800000,
        "status": "PENDING",
        "issuedDate": "2024-01-15T10:00:00Z",
        "dueDate": "2024-01-22T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 9.2. Get Invoice by ID

**Endpoint:** `GET /api/v1/billings/invoices/{id}`

**Response:** `200 OK`

---

### 9.3. Create Payment (MoMo)

**Endpoint:** `POST /api/v1/billings/momo/create`

**Description:** Tạo payment request với MoMo

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "invoiceId": "invoice-001",
  "amount": 800000,
  "orderInfo": "Thanh toan kham benh",
  "returnUrl": "http://localhost:3000/payment/result"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "paymentId": "payment-001",
    "payUrl": "https://test-payment.momo.vn/...",
    "qrCodeUrl": "https://...",
    "deeplink": "momo://..."
  }
}
```

**Flow:**
1. User clicks "Pay with MoMo"
2. Frontend calls this API
3. Backend creates payment record
4. Backend calls MoMo API
5. Return payment URL to frontend
6. User redirects to MoMo
7. User completes payment
8. MoMo sends IPN to backend
9. Backend updates payment status
10. User redirects back to frontend

---

### 9.4. Create Payment (VNPay)

**Endpoint:** `POST /api/v1/billings/vnpay/create`

**Description:** Tạo payment request với VNPay

**Request Body:**
```json
{
  "invoiceId": "invoice-001",
  "amount": 800000,
  "orderInfo": "Thanh toan kham benh",
  "returnUrl": "http://localhost:3000/payment/result"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "paymentId": "payment-001",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

---

### 9.5. Payment Return Handler

**Endpoint:** `GET /api/v1/billings/return`

**Description:** Xử lý return từ payment gateway (Internal)

**Query Parameters:**
- MoMo/VNPay return parameters

**Response:** Redirect to frontend with status

---

### 9.6. Get Payment History

**Endpoint:** `GET /api/v1/billings/payments/invoice/{invoiceId}`

**Description:** Lấy lịch sử thanh toán của invoice

**Response:** `200 OK`

---

## 10. PREDICTION APIs

### 10.1. Predict Heart Disease

**Endpoint:** `POST /predict`

**Description:** Dự đoán bệnh tim mạch

**Request Body:**
```json
{
  "patientId": "patient-001",
  "features": {
    "age": 55,
    "sex": 1,
    "chestPainType": 2,
    "restingBloodPressure": 130,
    "cholesterol": 250,
    "fastingBloodSugar": 1,
    "restingECG": 0,
    "maxHeartRate": 150,
    "exerciseInducedAngina": 0,
    "oldpeak": 2.5,
    "slope": 1,
    "numMajorVessels": 0,
    "thalassemia": 2
  }
}
```

**Response:** `200 OK`
```json
{
  "predictionId": "pred-001",
  "patientId": "patient-001",
  "prediction": 0.75,
  "riskLevel": "HIGH",
  "confidence": 0.85,
  "recommendation": "Consult a cardiologist immediately",
  "riskFactors": [
    "High cholesterol",
    "Hypertension"
  ],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 10.2. Get Prediction History

**Endpoint:** `GET /predictions/{patientId}`

**Description:** Lấy lịch sử dự đoán

**Response:** `200 OK`

---

## 11. CHATBOT APIs

### 11.1. Chat with Bot

**Endpoint:** `POST /chat`

**Description:** Tư vấn sức khỏe với chatbot AI

**Request Body:**
```json
{
  "message": "Tôi bị đau đầu và sốt, nên làm gì?",
  "conversationId": "chatbot-conv-001",
  "userId": "patient-001"
}
```

**Response:** `200 OK`
```json
{
  "response": "Dựa trên triệu chứng đau đầu và sốt, bạn có thể đang bị cảm cúm hoặc nhiễm virus. Tôi khuyên bạn:\n\n1. Nghỉ ngơi đầy đủ\n2. Uống nhiều nước\n3. Dùng thuốc hạ sốt như Paracetamol\n4. Nếu sốt trên 39°C hoặc kéo dài hơn 3 ngày, hãy đến khám bác sĩ\n\nBạn có cần tôi đặt lịch khám với bác sĩ không?",
  "sources": [
    {
      "content": "Đau đầu và sốt là triệu chứng phổ biến của cảm cúm...",
      "score": 0.85
    }
  ],
  "intent": "symptom_inquiry",
  "suggestedActions": [
    {
      "action": "book_appointment",
      "label": "Đặt lịch khám"
    }
  ]
}
```

---

## APPENDIX

### A. Error Codes

| Code | Message | Description |
|------|---------|-------------|
| AUTH_001 | Invalid credentials | Username/password incorrect |
| AUTH_002 | Token expired | Access token has expired |
| AUTH_003 | Insufficient permissions | User doesn't have required role |
| APT_001 | Slot not available | Appointment slot already booked |
| APT_002 | Past date | Cannot book appointment in the past |
| PAY_001 | Payment failed | Payment gateway error |
| VAL_001 | Validation error | Input validation failed |

### B. Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authenticated: 1000 requests per 15 minutes per user
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

### C. Webhook Events (Kafka Topics)

- `user-events`: User created, updated, deleted
- `appointment-events`: Appointment created, updated, cancelled
- `payment-events`: Payment successful, failed, refunded
- `notification-events`: Send email, push notification

---

**Phiên bản API**: v1  
**Ngày cập nhật**: 2024  
**Tác giả**: Smart Health API Team