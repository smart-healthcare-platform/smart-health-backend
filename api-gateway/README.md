# Smart Health API Gateway

API Gateway cho hệ thống chăm sóc sức khỏe thông minh, được xây dựng bằng Express.js và thiết kế theo kiến trúc microservices.

## **Tính năng chính**

### **Authentication & Authorization**
- JWT token verification và validation
- Role-based access control (Patient/Doctor/Admin)
- Secure token forwarding cho microservices
- Centralized authentication management

### **Security**
- Rate limiting với Redis support
- Request/Response logging cho security audit
- CORS configuration
- Helmet security headers
- Input validation và sanitization

### **Service Proxy**
- Intelligent request routing đến microservices
- Health monitoring của các services
- Circuit breaker pattern
- Automatic failover và error handling
- Load balancing ready

### **Monitoring & Observability**
- Comprehensive health checks
- Performance metrics
- Structured logging với Winston
- Request tracing với unique IDs
- Error tracking và alerting

### **Production Ready**
- Docker containerization
- Graceful shutdown handling
- Environment-based configuration
- Scalable architecture
- Redis caching support

## **Kiến trúc**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   API Gateway    │────│   Auth Service  │
│   (React/Vue)   │    │   (Express.js)   │    │   (Spring Boot) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │        │        │
                ┌──────▼──┐ ┌───▼───┐ ┌──▼──────┐
                │Patient  │ │Doctor │ │Appoint. │
                │Service  │ │Service│ │Service  │
                └─────────┘ └───────┘ └─────────┘
```

## **Cấu trúc dự án**

```
api-gateway/
├── src/
│   ├── config/
│   │   ├── index.js              # Cấu hình chính
│   │   └── logger.js             # Winston logger setup
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── errorHandler.js       # Error handling
│   ├── routes/
│   │   ├── index.js              # Main router
│   │   ├── health.js             # Health check routes
│   │   ├── auth.js               # Auth service routes
│   │   └── services.js           # Other services routes
│   ├── services/
│   │   └── serviceProxy.js       # Service proxy logic
│   ├── utils/
│   │   └── errors.js             # Custom error classes
│   └── app.js                    # Main application
├── logs/                         # Log files
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## **Cài đặt và chạy**

### **Prerequisites**
- Node.js 18+
- Redis (optional, có thể chạy bằng Docker)
- Auth Service đã chạy trên port 8081

### **1. Clone và cài đặt dependencies**
```bash
cd api-gateway
npm install
```

### **2. Cấu hình Environment**
```bash
# Copy file cấu hình mẫu
cp config.env.example .env

# Chỉnh sửa .env theo môi trường của bạn
nano .env
```

### **3. Chạy với Development mode**
```bash
# Chạy trực tiếp
npm run dev

# Hoặc chạy với Docker Compose
docker-compose up -d
```

### **4. Chạy với Production mode**
```bash
# Build Docker image
npm run docker:build

# Chạy container
npm run docker:run

# Hoặc với Docker Compose
NODE_ENV=production docker-compose up -d
```

## **Cấu hình**

### **Environment Variables**
```bash
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_ISSUER=smart-health-gateway

# Services URLs
AUTH_SERVICE_URL=http://localhost:8081
PATIENT_SERVICE_URL=http://localhost:8082
DOCTOR_SERVICE_URL=http://localhost:8083
APPOINTMENT_SERVICE_URL=http://localhost:8084

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 phút
RATE_LIMIT_MAX_REQUESTS=100

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

### **Rate Limiting Configuration**
```javascript
// Các loại rate limiting khác nhau
{
  standard: "100 requests/15 minutes",
  auth: "5 login attempts/15 minutes",
  register: "3 registrations/hour",
  admin: "200 requests/15 minutes"
}
```

## **API Endpoints**

### **Health Check**
```http
GET /health                    # Simple health check
GET /health/detailed          # Detailed system info
GET /health/services          # All services status
GET /health/services/{name}   # Specific service status
GET /health/ready             # Readiness probe
GET /health/live              # Liveness probe
```

### **Authentication (Proxied to Auth Service)**
```http
POST /v1/auth/register        # User registration
POST /v1/auth/login           # User login
POST /v1/auth/refresh-token   # Refresh JWT token
GET  /v1/auth/me              # Current user info
```

### **Services (Protected)**
```http
# Patient Service
GET    /v1/patients           # List patients
GET    /v1/patients/{id}      # Get patient details
POST   /v1/patients           # Create patient
PUT    /v1/patients/{id}      # Update patient

# Doctor Service  
GET    /v1/doctors            # List doctors
GET    /v1/doctors/{id}       # Get doctor details

# Appointment Service
GET    /v1/appointments       # List appointments
POST   /v1/appointments       # Create appointment
PUT    /v1/appointments/{id}  # Update appointment

# Notification Service
GET    /v1/notifications      # Get notifications
POST   /v1/notifications/send # Send notification
```

## **Authentication Flow**

### **1. User Login**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient01",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "patient01",
      "role": "PATIENT"
    }
  }
}
```

### **2. Access Protected Resources**
```bash
curl -X GET http://localhost:3000/v1/patients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## **Security Features**

### **Rate Limiting**
- **Standard API**: 100 requests/15 minutes
- **Authentication**: 5 attempts/15 minutes  
- **Registration**: 3 attempts/hour
- **Admin endpoints**: 200 requests/15 minutes

### **JWT Security**
- Token validation on every request
- Role-based access control
- Automatic token forwarding to services
- Refresh token support

### **Request Security**
- Input validation
- SQL injection protection
- XSS protection với Helmet
- CORS configuration

## **Monitoring**

### **Health Monitoring**
```bash
# Gateway health
curl http://localhost:3000/health

# All services health
curl http://localhost:3000/health/services

# Specific service health
curl http://localhost:3000/health/services/auth
```

### **Logs**
```bash
# View logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Docker logs
docker logs smart-health-gateway
```

### **Metrics**
```bash
# Basic metrics
curl http://localhost:3000/health/metrics
```

## **Docker Support**

### **Development với Docker Compose**
```bash
# Chạy tất cả services
docker-compose up -d

# Chạy với Redis Commander
docker-compose --profile dev up -d

# View logs
docker-compose logs -f api-gateway

# Stop services
docker-compose down
```

### **Production Deployment**
```bash
# Build production image
docker build -t smart-health-gateway:latest .

# Run with custom configuration
docker run -d \
  --name smart-health-gateway \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-production-secret \
  -v /var/log/smart-health:/app/logs \
  smart-health-gateway:latest
```

## **Testing**

### **Manual Testing**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'

# Test rate limiting
for i in {1..10}; do curl http://localhost:3000/health; done
```

### **Load Testing**
```bash
# Install wrk
sudo apt install wrk

# Test performance
wrk -t12 -c400 -d30s http://localhost:3000/health
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Service Connection Errors**
   ```bash
   # Check service URLs in .env
   # Verify services are running
   curl http://localhost:8081/actuator/health
   ```

2. **JWT Token Issues**
   ```bash
   # Verify JWT_SECRET matches auth service
   # Check token expiration
   ```

3. **Rate Limiting Issues**
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Clear rate limit cache
   redis-cli FLUSHDB
   ```

4. **Docker Issues**
   ```bash
   # Check container status
   docker ps
   
   # View logs
   docker logs smart-health-gateway
   
   # Restart services
   docker-compose restart
   ```

## **Deployment**

### **Production Checklist**
- [ ] Update JWT_SECRET trong production
- [ ] Configure proper CORS origins
- [ ] Set up Redis cluster cho high availability
- [ ] Configure log rotation
- [ ] Set up monitoring và alerting
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL/TLS termination
- [ ] Configure container orchestration (Kubernetes)

### **Scaling**
```bash
# Scale with Docker Compose
docker-compose up -d --scale api-gateway=3

# Load balancer configuration với Nginx
upstream api_gateway {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```