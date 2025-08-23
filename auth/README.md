# Smart Health Auth Service

## Giới thiệu

Auth Service là một microservice chuyên dụng cho hệ thống chăm sóc sức khỏe thông minh, được xây dựng bằng Spring Boot và JWT Authentication. Service này cung cấp các chức năng xác thực và quản lý người dùng với các tính năng bảo mật tiên tiến.

### Tính năng chính

- ✅ Đăng ký tài khoản (Register)
- ✅ Đăng nhập (Login)
- ✅ Xác thực JWT Token
- ✅ Refresh Token với Refresh Token Rotation
- ✅ Quản lý người dùng theo vai trò (Patient/Doctor/Admin)
- ✅ Quản lý trạng thái tài khoản (Active/Inactive)
- ✅ Role-based Access Control (RBAC)

## Kiến trúc hệ thống

```
src/main/java/fit/iuh/auth/
├── AuthApplication.java          # Main Application
├── config/
│   └── SecurityConfig.java       # Spring Security Configuration
├── controller/
│   ├── AuthController.java       # Authentication Endpoints
│   └── UserController.java       # User Management Endpoints
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java     # Login Request DTO
│   │   └── RegisterRequest.java  # Register Request DTO
│   └── response/
│       ├── ApiResponse.java      # Generic API Response
│       └── AuthResponse.java     # Authentication Response DTO
├── entity/
│   └── User.java                 # User Entity
├── enums/
│   └── Role.java                 # User Role Enum
├── exception/
│   └── GlobalExceptionHandler.java # Global Exception Handler
├── repository/
│   └── UserRepository.java       # User Repository
├── security/
│   └── JwtAuthenticationFilter.java # JWT Filter
└── service/
    ├── AuthService.java          # Authentication Service
    ├── JwtService.java           # JWT Token Service
    └── UserService.java          # User Service
```

## Security Implementation

### JWT Authentication

Hệ thống sử dụng JWT (JSON Web Tokens) để xác thực người dùng với các đặc điểm:

- Access Token có thời gian sống 24 giờ
- Refresh Token có thời gian sống 7 ngày
- Refresh Token Rotation: Mỗi lần refresh tạo refresh token mới
- Mã hóa password sử dụng BCrypt

### Refresh Token Rotation

Một trong những tính năng bảo mật quan trọng của hệ thống là Refresh Token Rotation:

- Mỗi lần sử dụng refresh token để lấy access token mới, hệ thống tạo refresh token mới
- Refresh token cũ trở nên vô hiệu ngay lập tức
- Giúp giảm thiểu rủi ro nếu refresh token bị đánh cắp
- Tăng cường bảo mật cho hệ thống authentication

### Role-based Access Control (RBAC)

Hệ thống hỗ trợ 3 vai trò người dùng:

- **PATIENT**: Bệnh nhân - Quyền cơ bản
- **DOCTOR**: Bác sĩ - Quyền trung cấp
- **ADMIN**: Quản trị viên - Quyền cao nhất

## Database Schema

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Cài đặt và Chạy

### 1. Yêu cầu hệ thống

- Java 17+
- MySQL 8.0+
- Gradle 7.0+

### 2. Setup Database

```sql
CREATE DATABASE smart_health_auth;
CREATE USER 'auth_user'@'localhost' IDENTIFIED BY 'auth_password';
GRANT ALL PRIVILEGES ON smart_health_auth.* TO 'auth_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Cấu hình Application Properties

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/smart_health_auth
spring.datasource.username=auth_user
spring.datasource.password=auth_password

# JWT Configuration
jwt.secret=smartHealthSecretKeyForJWTTokenGenerationAndValidation2024
jwt.expiration=86400000
jwt.refresh.expiration=604800000
```

### 4. Build và Run

```bash
# Build project
./gradlew build

# Run application
./gradlew bootRun
```

Application sẽ chạy trên: `http://localhost:8081`

## API Endpoints

### Authentication Endpoints

#### 1. Đăng ký (Register)

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "patient01",
    "password": "password123",
    "role": "PATIENT"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "patient01",
      "role": "PATIENT",
      "createdAt": "2024-01-01T10:00:00"
    }
  },
  "code": 200
}
```

#### 2. Đăng nhập (Login)

```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "patient01",
    "password": "password123"
}
```

#### 3. Refresh Token

```http
POST /api/auth/refresh-token
Authorization: Bearer {refresh_token}
```

### User Management Endpoints

#### 1. Lấy thông tin người dùng hiện tại

```http
GET /api/users/me
Authorization: Bearer {access_token}
```

#### 2. Lấy tất cả người dùng (Admin only)

```http
GET /api/users/all
Authorization: Bearer {admin_token}
```

#### 3. Lấy người dùng theo vai trò (Admin only)

```http
GET /api/users/role/PATIENT
Authorization: Bearer {admin_token}
```

#### 4. Vô hiệu hóa tài khoản (Admin only)

```http
PUT /api/users/{userId}/deactivate
Authorization: Bearer {admin_token}
```

#### 5. Kích hoạt tài khoản (Admin only)

```http
PUT /api/users/{userId}/activate
Authorization: Bearer {admin_token}
```

## Phân quyền (Authorization)

### Roles

- **PATIENT**: Bệnh nhân - Quyền cơ bản
- **DOCTOR**: Bác sĩ - Quyền trung cấp
- **ADMIN**: Quản trị viên - Quyền cao nhất

### Endpoint Permissions

- `/api/auth/**` - Public (không cần token)
- `/api/users/me` - Authenticated users
- `/api/users/all` - Admin only
- `/api/users/role/**` - Admin only
- `/api/users/{id}/activate|deactivate` - Admin only

## Security Features

1. **JWT Authentication**: Sử dụng JWT tokens cho authentication
2. **Password Encryption**: BCrypt password hashing
3. **Role-based Access Control**: Phân quyền theo vai trò
4. **Token Expiration**: Access token (24h), Refresh token (7 days)
5. **Refresh Token Rotation**: Mỗi lần refresh tạo refresh token mới
6. **Account Management**: Kích hoạt/vô hiệu hóa tài khoản

## Testing

### Tạo tài khoản Admin đầu tiên

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123",
    "role": "ADMIN"
}
```

### Test Authentication Flow

1. Register một patient account
2. Login để lấy tokens
3. Sử dụng access token để gọi protected endpoints
4. Refresh token khi access token hết hạn

## Monitoring & Health Check

- Health check: `GET /api/auth/health`
- Application metrics: Spring Boot Actuator endpoints

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_health_auth
DB_USERNAME=auth_user
DB_PASSWORD=auth_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Server
SERVER_PORT=8081
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Kiểm tra MySQL đã chạy
   - Verify database credentials
   - Check network connectivity

2. **JWT Token Invalid**

   - Token đã hết hạn
   - Secret key không đúng
   - Token format sai

3. **Authorization Failed**
   - User không có đủ quyền
   - Token không hợp lệ
   - Account bị vô hiệu hóa

## Development Guide

### Thêm endpoints mới

1. Tạo DTO request/response
2. Update Controller với endpoints
3. Implement logic trong Service
4. Add authorization trong SecurityConfig
5. Update documentation

### Thêm role mới

1. Update Role enum
2. Update SecurityConfig permissions
3. Update database if needed
4. Test authorization
