# Admin Dashboard API Integration - Quick Reference

## 📋 Tổng quan

Thay vì tạo Admin Service mới, chúng ta tích hợp các API Dashboard vào các microservices hiện có để giảm complexity và tận dụng infrastructure sẵn có.

## 🏗️ Kiến trúc

```
Frontend (Next.js)
      ↓
API Gateway (Express.js) - Aggregator & Cache Layer
      ↓
┌─────┴─────┬─────────┬─────────┬─────────┐
↓           ↓         ↓         ↓         ↓
Patient   Doctor   Appointment Billing  Medicine
Service   Service   Service    Service  Service
(NestJS)  (NestJS)  (NestJS)   (Spring) (NestJS)
```

## 📦 Phân bổ API theo Service

### 1. **API Gateway** (Port 8080)
- `GET /v1/admin/dashboard/stats` - Tổng hợp từ tất cả services
- `GET /v1/admin/system/health` - Health check
- `GET /v1/admin/alerts` - Quản lý alerts

**Chức năng:**
- Aggregation layer
- Redis caching (TTL: 30s)
- Socket.io real-time
- Admin authentication

### 2. **Patient Service** (Port 8082)
- `GET /v1/admin/patients/stats` - Thống kê patients
- `GET /v1/admin/patients/growth` - Tăng trưởng
- `GET /v1/admin/patients/demographics` - Nhân khẩu học
- `GET /v1/admin/patients/recent` - Patients mới

### 3. **Doctor Service** (Port 8083)
- `GET /v1/admin/doctors/stats` - Thống kê doctors
- `GET /v1/admin/doctors/top` - Top doctors
- `GET /v1/admin/departments/performance` - Hiệu suất departments

### 4. **Appointment Service** (Port 8084)
- `GET /v1/admin/appointments/stats` - Thống kê appointments
- `GET /v1/admin/appointments/trends` - Xu hướng
- `GET /v1/admin/appointments/recent` - Appointments gần đây

### 5. **Billing Service** (Port 8085)
- `GET /v1/admin/revenue/stats` - Thống kê doanh thu
- `GET /v1/admin/revenue/distribution` - Phân bố doanh thu
- `GET /v1/admin/revenue/trends` - Xu hướng doanh thu

### 6. **Medicine Service** (Port 8086)
- `GET /v1/admin/medicine/stats` - Thống kê thuốc
- `GET /v1/admin/medicine/low-stock` - Thuốc sắp hết

## 🚀 Quick Start (Triển khai từng bước)

### Phase 1: API Gateway (1 ngày)

```bash
cd api-gateway

# 1. Install dependencies
npm install ioredis socket.io jsonwebtoken

# 2. Tạo cấu trúc thư mục
mkdir -p src/routes/admin
mkdir -p src/services/{cache,aggregator}
mkdir -p src/socket

# 3. Tạo các file chính:
# - src/services/cache/redisService.js
# - src/services/aggregator/dashboardAggregator.js
# - src/middleware/adminAuth.js
# - src/routes/admin/index.js
# - src/routes/admin/dashboard.js
# - src/socket/adminSocket.js

# 4. Update .env
echo "REDIS_HOST=localhost" >> .env
echo "REDIS_PORT=6379" >> .env
echo "GATEWAY_SECRET=your-secret-key" >> .env
```

### Phase 2: Patient Service (1 ngày)

```bash
cd patient

# 1. Tạo admin module
mkdir -p src/modules/admin/dto
touch src/modules/admin/{admin.module.ts,admin.controller.ts,admin.service.ts}

# 2. Tạo Internal Guard
mkdir -p src/common/guards
touch src/common/guards/internal.guard.ts

# 3. Update .env
echo "GATEWAY_SECRET=your-secret-key" >> .env

# 4. Register AdminModule trong app.module.ts
```

### Phase 3: Các Services còn lại (1-2 ngày)

Làm tương tự cho:
- Appointment Service
- Doctor Service
- Billing Service
- Medicine Service

## 🔐 Security

### 1. Admin Authentication (API Gateway)

```javascript
// src/middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  if (!decoded.roles?.includes('ADMIN')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  req.user = decoded;
  next();
};
```

### 2. Internal Service Auth (NestJS Services)

```typescript
// src/common/guards/internal.guard.ts
@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-gateway-secret'];
    
    return secret === process.env.GATEWAY_SECRET;
  }
}
```

## 📊 Caching Strategy

### Redis Key Structure

```
admin:stats:v1              → Dashboard stats (TTL: 30s)
admin:patients:growth:*     → Patient growth (TTL: 1h)
admin:doctors:top:*         → Top doctors (TTL: 10m)
admin:appointments:trends:* → Appointment trends (TTL: 60s)
admin:revenue:stats:*       → Revenue stats (TTL: 60s)
admin:system:health         → System health (TTL: 5s)
```

### Cache Invalidation

```javascript
// Khi có event mới (Kafka consumer)
kafkaConsumer.on('appointment.created', () => {
  redis.del('admin:stats:v1');
  redis.del('admin:appointments:trends:*');
});
```

## 🔄 Real-time Updates

### Server (API Gateway)

```javascript
// src/socket/adminSocket.js
const adminNamespace = io.of('/admin');

adminNamespace.on('connection', (socket) => {
  socket.on('subscribe:dashboard', () => {
    socket.join('dashboard');
  });
});

// Broadcast updates
adminNamespace.to('dashboard').emit('dashboard:stats:updated', data);
```

### Client (Frontend)

```typescript
const socket = io('http://localhost:8080/admin', {
  path: '/admin-socket',
  auth: { token: localStorage.getItem('token') }
});

socket.on('dashboard:stats:updated', (data) => {
  // Update UI
});
```

## 🧪 Testing

### 1. Test Individual Service

```bash
curl -H "X-Internal-Request: true" \
     -H "X-Gateway-Secret: your-secret" \
     http://localhost:8082/v1/admin/patients/stats
```

### 2. Test API Gateway Aggregation

```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}' | jq -r '.token')

# Test dashboard
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/v1/admin/dashboard/stats
```

### 3. Test Cache

```bash
redis-cli
> KEYS admin:*
> GET admin:stats:v1
> TTL admin:stats:v1
```

## 📈 Performance Optimization

### 1. Database Indexes

```sql
-- Appointments
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Patients
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
CREATE INDEX idx_patients_active ON patients(is_active);

-- Payments
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

### 2. Materialized Views (PostgreSQL)

```sql
CREATE MATERIALIZED VIEW admin_daily_stats AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM appointments
GROUP BY date_trunc('day', created_at);

-- Refresh định kỳ
REFRESH MATERIALIZED VIEW admin_daily_stats;
```

## 🐳 Docker Setup

### Update docker-compose.yml

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  api-gateway:
    environment:
      - REDIS_HOST=redis
      - GATEWAY_SECRET=${GATEWAY_SECRET}

  patient:
    environment:
      - GATEWAY_SECRET=${GATEWAY_SECRET}

  # ... other services

volumes:
  redis_data:
```

### Environment Variables

```env
# .env file
REDIS_HOST=localhost
REDIS_PORT=6379
GATEWAY_SECRET=your-secure-secret-change-in-production
JWT_SECRET=your-jwt-secret
```

## ✅ Implementation Checklist

### Phase 1: Infrastructure
- [ ] Redis running
- [ ] Environment variables configured
- [ ] Admin authentication middleware
- [ ] Internal guard created

### Phase 2: API Gateway
- [ ] Redis service implemented
- [ ] Dashboard aggregator service
- [ ] Admin routes created
- [ ] Socket.io namespace setup
- [ ] Cache invalidation logic

### Phase 3: Microservices
- [ ] Patient Service admin module
- [ ] Doctor Service admin module
- [ ] Appointment Service admin module
- [ ] Billing Service admin module
- [ ] Medicine Service admin module

### Phase 4: Testing & Optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] Database indexes added
- [ ] Load testing completed
- [ ] Monitoring setup

### Phase 5: Frontend Integration
- [ ] API client configured
- [ ] Socket.io client setup
- [ ] Dashboard components integrated
- [ ] Error handling
- [ ] Real-time updates working

## 📚 Tài liệu chi tiết

1. **INTEGRATION_ARCHITECTURE.md** - Kiến trúc tổng quan và design decisions
2. **STEP_BY_STEP_GUIDE.md** - Hướng dẫn triển khai từng bước chi tiết
3. **CODE_EXAMPLES.md** - Code examples đầy đủ cho tất cả services

## 🔧 Troubleshooting

### Issue: Service không connect được Redis
**Solution:** Kiểm tra `REDIS_HOST` và `REDIS_PORT` trong .env

### Issue: Internal guard từ chối requests
**Solution:** Đảm bảo `GATEWAY_SECRET` giống nhau ở tất cả services

### Issue: Aggregation chậm
**Solution:** 
1. Kiểm tra các service endpoint riêng lẻ
2. Thêm database indexes
3. Tăng cache TTL

### Issue: Cache không invalidate
**Solution:** Implement Kafka consumers để listen events

## 🎯 Ưu điểm của phương án này

✅ **Không tạo service mới** - Giảm complexity  
✅ **Tận dụng infrastructure hiện có** - Tiết kiệm tài nguyên  
✅ **Domain ownership rõ ràng** - Mỗi service quản lý data của mình  
✅ **Dễ scale** - Scale từng service độc lập  
✅ **Caching hiệu quả** - Redis cache ở Gateway layer  
✅ **Real-time updates** - Socket.io cho live data  
✅ **Security tốt** - Multi-layer authentication  

## 📞 Support

Nếu cần hỗ trợ thêm:
- Review code examples trong `CODE_EXAMPLES.md`
- Follow step-by-step guide trong `STEP_BY_STEP_GUIDE.md`
- Xem architecture details trong `INTEGRATION_ARCHITECTURE.md`

---

**Thời gian ước tính:** 3-4 ngày cho implementation hoàn chỉnh  
**Team size:** 1-2 developers  
**Difficulty:** Medium

Good luck! 🚀