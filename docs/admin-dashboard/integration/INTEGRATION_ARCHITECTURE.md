# Admin Dashboard API Integration Architecture

## 📋 Tổng quan

Tài liệu này mô tả kiến trúc tích hợp các API Admin Dashboard vào các microservices hiện có thay vì tạo service mới.

## 🎯 Mục tiêu

- ✅ Tận dụng infrastructure hiện có
- ✅ Giảm complexity của hệ thống
- ✅ Phân tán logic theo domain ownership
- ✅ Tối ưu hiệu năng với caching
- ✅ Hỗ trợ real-time updates

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                 Admin Dashboard (Next.js Frontend)               │
│                     Port: 3000 (embedded in backend)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/Socket.io
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway (Express.js) - Port 8080                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ New Admin Routes Module                                   │  │
│  │ - /v1/admin/dashboard/stats (aggregator)                  │  │
│  │ - /v1/admin/system/health                                 │  │
│  │ - /v1/admin/alerts                                        │  │
│  │                                                           │  │
│  │ Responsibilities:                                         │  │
│  │ • Aggregate data from multiple services                  │  │
│  │ • Cache frequently accessed data (Redis)                 │  │
│  │ • Real-time event coordination (Socket.io)               │  │
│  │ • System health monitoring                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┘
     │         │         │         │         │          │
     │ Proxy   │ Proxy   │ Proxy   │ Proxy   │ Proxy    │ Proxy
     ▼         ▼         ▼         ▼         ▼          ▼
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────────┐
│ Patient │ Doctor  │Appoint. │ Billing │Medicine │Notification │
│ Service │ Service │ Service │ Service │ Service │  Service    │
│ NestJS  │ NestJS  │ NestJS  │Spring   │ NestJS  │   NestJS    │
│ :8082   │ :8083   │ :8084   │ :8085   │ :8086   │   :8087     │
│         │         │         │         │         │             │
│ + Admin │ + Admin │ + Admin │ + Admin │ + Admin │   + Admin   │
│  Module │  Module │  Module │  Module │  Module │    Module   │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────────┘
     │         │         │         │         │          │
     └─────────┴─────────┴─────────┴─────────┴──────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   Redis     │
                  │  (Cache)    │
                  │   :6379     │
                  └─────────────┘
```

## 📊 Phân bổ API theo Service

### 1. **API Gateway** (Express.js - Port 8080)

**File structure:**
```
api-gateway/
├── src/
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── index.js              # Main admin router
│   │   │   ├── dashboard.js          # Dashboard aggregation
│   │   │   ├── system.js             # System health & monitoring
│   │   │   └── alerts.js             # Alert management
│   ├── services/
│   │   ├── cache/
│   │   │   └── redisService.js       # Redis caching service
│   │   ├── aggregator/
│   │   │   └── dashboardAggregator.js # Data aggregation logic
│   └── socket/
│       └── adminSocket.js            # Socket.io for real-time
```

**Responsibilities:**
- ✅ Aggregate dashboard statistics
- ✅ System health monitoring
- ✅ Alert management
- ✅ Caching layer (Redis)
- ✅ Real-time event broadcasting
- ✅ Request routing & authentication

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/dashboard/stats` | Tổng hợp KPI từ tất cả services | 30s |
| GET | `/v1/admin/system/health` | Health check tất cả services | 5s |
| GET | `/v1/admin/alerts` | Danh sách alerts tổng hợp | 10s |
| POST | `/v1/admin/alerts/:id/acknowledge` | Xác nhận alert | - |

---

### 2. **Patient Service** (NestJS - Port 8082)

**File structure:**
```
patient/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       ├── patient-growth.dto.ts
│   │   │       └── patient-stats.dto.ts
```

**Responsibilities:**
- ✅ Patient growth analytics
- ✅ Patient statistics
- ✅ Patient demographics
- ✅ Active patient counts

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/patients/stats` | Thống kê tổng quan patients | 60s |
| GET | `/v1/admin/patients/growth` | Patient growth over time | 1h |
| GET | `/v1/admin/patients/demographics` | Phân bố theo tuổi, giới tính | 30m |
| GET | `/v1/admin/patients/recent` | Patients mới đăng ký gần đây | 60s |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 15234,
    "activePatients": 8432,
    "newThisMonth": 234,
    "growth": {
      "daily": [
        { "date": "2024-01-01", "count": 120 },
        { "date": "2024-01-02", "count": 135 }
      ]
    },
    "demographics": {
      "byAge": {
        "0-18": 1234,
        "19-35": 4532,
        "36-50": 5432,
        "51+": 4036
      },
      "byGender": {
        "male": 7234,
        "female": 8000
      }
    }
  }
}
```

---

### 3. **Doctor Service** (NestJS - Port 8083)

**File structure:**
```
doctor/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       ├── doctor-stats.dto.ts
│   │   │       └── top-doctors.dto.ts
```

**Responsibilities:**
- ✅ Doctor statistics
- ✅ Top performing doctors
- ✅ Doctor availability
- ✅ Department performance

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/doctors/stats` | Thống kê tổng quan doctors | 60s |
| GET | `/v1/admin/doctors/top` | Top doctors by appointments/rating | 10m |
| GET | `/v1/admin/doctors/availability` | Doctor availability overview | 30s |
| GET | `/v1/admin/departments/performance` | Performance by department | 30m |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalDoctors": 245,
    "activeDoctors": 189,
    "onlineNow": 42,
    "topDoctors": [
      {
        "id": "doc_123",
        "name": "Dr. Nguyễn Văn A",
        "specialty": "Cardiology",
        "rating": 4.9,
        "totalAppointments": 1234,
        "completedThisMonth": 89
      }
    ],
    "departmentPerformance": [
      {
        "department": "Cardiology",
        "totalDoctors": 25,
        "avgRating": 4.7,
        "totalAppointments": 3456
      }
    ]
  }
}
```

---

### 4. **Appointment Service** (NestJS - Port 8084)

**File structure:**
```
appointment/
├── src/
│   ├── module/
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       ├── appointment-stats.dto.ts
│   │   │       └── appointment-trends.dto.ts
```

**Responsibilities:**
- ✅ Appointment statistics
- ✅ Appointment trends
- ✅ Recent appointments
- ✅ Appointment distribution

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/appointments/stats` | Thống kê appointments | 30s |
| GET | `/v1/admin/appointments/trends` | Trends theo thời gian | 60s |
| GET | `/v1/admin/appointments/recent` | Appointments gần đây | 10s |
| GET | `/v1/admin/appointments/distribution` | Phân bố theo status/time | 60s |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalToday": 127,
    "completed": 89,
    "pending": 23,
    "cancelled": 15,
    "trends": {
      "hourly": [
        { "hour": "08:00", "count": 12 },
        { "hour": "09:00", "count": 18 }
      ]
    },
    "distribution": {
      "byStatus": {
        "pending": 234,
        "confirmed": 456,
        "completed": 2345,
        "cancelled": 123
      },
      "byType": {
        "consultation": 1234,
        "followUp": 567,
        "emergency": 89
      }
    }
  }
}
```

---

### 5. **Billing Service** (Spring Boot - Port 8085)

**File structure:**
```
billing/
├── src/main/java/com/smarthealth/billing/
│   ├── admin/
│   │   ├── AdminController.java
│   │   ├── AdminService.java
│   │   └── dto/
│   │       ├── RevenueStatsDTO.java
│   │       └── RevenueDistributionDTO.java
```

**Responsibilities:**
- ✅ Revenue statistics
- ✅ Revenue distribution
- ✅ Payment analytics
- ✅ Financial reports

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/revenue/stats` | Thống kê revenue | 60s |
| GET | `/v1/admin/revenue/distribution` | Phân bố revenue | 5m |
| GET | `/v1/admin/revenue/trends` | Revenue trends | 1h |
| GET | `/v1/admin/payments/methods` | Phân tích theo payment method | 30m |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "todayRevenue": 45678000,
    "monthRevenue": 1234567000,
    "growth": 15.5,
    "distribution": {
      "byService": {
        "consultation": 23456000,
        "medicine": 12345000,
        "testing": 9876000
      },
      "byPaymentMethod": {
        "cash": 15678000,
        "card": 20000000,
        "insurance": 10000000
      }
    },
    "trends": {
      "daily": [
        { "date": "2024-01-01", "amount": 1234000 },
        { "date": "2024-01-02", "amount": 1456000 }
      ]
    }
  }
}
```

---

### 6. **Medicine Service** (NestJS - Port 8086)

**File structure:**
```
medicine/
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       └── medicine-stats.dto.ts
```

**Responsibilities:**
- ✅ Medicine inventory stats
- ✅ Low stock alerts
- ✅ Prescription analytics

**Endpoints:**

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/v1/admin/medicine/stats` | Thống kê medicine | 5m |
| GET | `/v1/admin/medicine/low-stock` | Thuốc sắp hết | 30s |
| GET | `/v1/admin/medicine/popular` | Thuốc được kê nhiều nhất | 1h |

---

## 🔄 Data Flow

### Scenario 1: Load Dashboard Stats

```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /v1/admin/dashboard/stats
     ▼
┌─────────────────┐
│  API Gateway    │
│                 │
│ 1. Check Redis  │──── Cache HIT? ──────┐
│    cache        │                       │
└────┬────────────┘                       │
     │ Cache MISS                         │
     ▼                                    │
┌─────────────────┐                       │
│  Aggregator     │                       │
│  Service        │                       │
│                 │                       │
│ 2. Call APIs:   │                       │
│    - Patients   │◄────┐                 │
│    - Doctors    │     │                 │
│    - Appts      │     │ Parallel        │
│    - Revenue    │     │ Requests        │
│    - Medicine   │◄────┘                 │
└────┬────────────┘                       │
     │ 3. Aggregate                       │
     │    results                         │
     ▼                                    │
┌─────────────────┐                       │
│  Redis Cache    │                       │
│  TTL: 30s       │                       │
└────┬────────────┘                       │
     │                                    │
     ├────────────────────────────────────┘
     │ 4. Return data
     ▼
┌─────────┐
│ Client  │
└─────────┘
```

### Scenario 2: Real-time Update

```
┌─────────────────┐
│ Appointment Svc │
│                 │
│ New appointment │
│    created      │
└────┬────────────┘
     │ 1. Emit Kafka event
     │    "appointment.created"
     ▼
┌─────────────────┐
│  API Gateway    │
│ Kafka Consumer  │
│                 │
│ 2. Receive event│
│                 │
│ 3. Invalidate   │
│    cache        │◄──────────┐
│                 │           │
│ 4. Broadcast    │           │
│    via Socket.io│           │
└────┬────────────┘           │
     │                        │
     ▼                        │
┌─────────────────┐           │
│ Redis Cache     │           │
│ (invalidated)   │───────────┘
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Connected       │
│ Admin Clients   │
│                 │
│ UI auto-updates │
└─────────────────┘
```

## 🔐 Security & Authentication

### 1. Role-Based Access Control (RBAC)

**API Gateway Middleware:**
```javascript
// src/middleware/adminAuth.js
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check admin role
    if (!decoded.roles?.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};
```

### 2. Service-to-Service Authentication

**Internal API calls từ Gateway:**
```javascript
// src/services/serviceProxy.js
const callService = async (serviceName, endpoint, options = {}) => {
  const serviceUrl = config.services[serviceName].url;
  
  // Add internal auth header
  const headers = {
    ...options.headers,
    'X-Internal-Request': 'true',
    'X-Gateway-Secret': process.env.GATEWAY_SECRET
  };
  
  return axios({
    url: `${serviceUrl}${endpoint}`,
    ...options,
    headers
  });
};
```

**Service validation:**
```typescript
// NestJS Guard
@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-gateway-secret'];
    
    return secret === process.env.GATEWAY_SECRET;
  }
}
```

## 📦 Caching Strategy

### Redis Key Structure

```
admin:stats:{version}              → Dashboard stats (TTL: 30s)
admin:patients:growth:{period}     → Patient growth (TTL: 1h)
admin:doctors:top:{limit}          → Top doctors (TTL: 10m)
admin:appointments:trends:{date}   → Appointment trends (TTL: 60s)
admin:revenue:stats:{date}         → Revenue stats (TTL: 60s)
admin:system:health                → System health (TTL: 5s)
admin:alerts:active                → Active alerts (TTL: 10s)
```

### Cache Invalidation Strategy

**Event-based invalidation:**
```javascript
// Kafka consumer in API Gateway
kafkaConsumer.on('appointment.created', () => {
  redis.del('admin:stats:v1');
  redis.del('admin:appointments:trends:*');
});

kafkaConsumer.on('patient.registered', () => {
  redis.del('admin:stats:v1');
  redis.del('admin:patients:growth:*');
});

kafkaConsumer.on('payment.completed', () => {
  redis.del('admin:stats:v1');
  redis.del('admin:revenue:*');
});
```

## 🔄 Real-time Updates (Socket.io)

### Server Setup (API Gateway)

```javascript
// src/socket/adminSocket.js
const io = require('socket.io')(server, {
  path: '/admin-socket',
  cors: { origin: config.cors.origin }
});

const adminNamespace = io.of('/admin');

adminNamespace.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.roles?.includes('ADMIN')) {
      throw new Error('Not admin');
    }
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

adminNamespace.on('connection', (socket) => {
  console.log(`Admin connected: ${socket.user.id}`);
  
  socket.on('subscribe:dashboard', () => {
    socket.join('dashboard');
  });
});

// Broadcast updates
const broadcastDashboardUpdate = (event, data) => {
  adminNamespace.to('dashboard').emit(event, data);
};

module.exports = { broadcastDashboardUpdate };
```

### Client Setup (Frontend)

```typescript
// Frontend socket connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080/admin', {
  path: '/admin-socket',
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => {
  socket.emit('subscribe:dashboard');
});

socket.on('dashboard:stats:updated', (data) => {
  // Update UI
});

socket.on('appointment:created', (appointment) => {
  // Add to recent appointments
});
```

## 📈 Performance Optimization

### 1. Database Optimization

**Materialized Views (PostgreSQL):**
```sql
-- Daily stats materialized view
CREATE MATERIALIZED VIEW admin_daily_stats AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM appointments
GROUP BY date_trunc('day', created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW admin_daily_stats;
```

**Indexes:**
```sql
-- Appointments
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);

-- Patients
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX idx_patients_active ON patients(is_active) WHERE is_active = true;

-- Payments
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);
```

### 2. API Response Optimization

**Pagination:**
```typescript
@Get('/appointments/recent')
async getRecentAppointments(
  @Query('limit') limit: number = 10,
  @Query('offset') offset: number = 0
) {
  return this.adminService.getRecentAppointments(limit, offset);
}
```

**Field selection:**
```typescript
@Get('/doctors/top')
async getTopDoctors(
  @Query('fields') fields?: string // e.g., "id,name,rating"
) {
  const selectedFields = fields?.split(',') || defaultFields;
  return this.adminService.getTopDoctors(selectedFields);
}
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// appointment/src/module/admin/admin.service.spec.ts
describe('AdminService', () => {
  it('should return appointment stats', async () => {
    const stats = await service.getAppointmentStats();
    expect(stats).toHaveProperty('totalToday');
    expect(stats).toHaveProperty('completed');
  });
});
```

### Integration Tests

```typescript
// api-gateway/test/admin.integration.test.js
describe('Admin Dashboard API', () => {
  it('should aggregate stats from all services', async () => {
    const response = await request(app)
      .get('/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('totalPatients');
    expect(response.body.data).toHaveProperty('activeDoctors');
  });
});
```

## 📊 Monitoring & Logging

### Metrics to track

```javascript
// Prometheus metrics
const promClient = require('prom-client');

const adminApiDuration = new promClient.Histogram({
  name: 'admin_api_duration_seconds',
  help: 'Admin API response time',
  labelNames: ['endpoint', 'status']
});

const cacheHitRate = new promClient.Counter({
  name: 'admin_cache_hits_total',
  help: 'Admin cache hit rate',
  labelNames: ['key_pattern']
});
```

### Structured Logging

```javascript
logger.info('Admin dashboard stats requested', {
  userId: req.user.id,
  cacheHit: cached !== null,
  responseTime: Date.now() - startTime,
  services: ['patient', 'doctor', 'appointment', 'billing']
});
```

## 🚀 Deployment Checklist

- [ ] Add admin routes to API Gateway
- [ ] Implement admin modules in each service
- [ ] Configure Redis caching
- [ ] Set up Socket.io for real-time
- [ ] Implement RBAC middleware
- [ ] Add database indexes
- [ ] Configure Kafka consumers for cache invalidation
- [ ] Write unit & integration tests
- [ ] Set up monitoring & alerting
- [ ] Update API documentation
- [ ] Load testing
- [ ] Security audit

## 📚 Next Steps

1. Review `IMPLEMENTATION_GUIDE.md` for step-by-step implementation
2. See `API_SPECIFICATIONS.md` for detailed API contracts
3. Check `CODE_EXAMPLES.md` for implementation templates
4. Read `DEPLOYMENT.md` for deployment instructions