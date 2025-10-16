# 🧪 Testing Guide - Billing Service với PaymentType mới

## 📋 Chuẩn bị Test Environment

### 1. Khởi động Services:
```bash
# Terminal 1 - API Gateway
cd api-gateway
npm start

# Terminal 2 - Billing Service
cd billing
./gradlew bootRun

# Terminal 3 - Appointment Service (sau khi implement)
cd appointment
npm run start:dev
```

### 2. Check Services Health:
```bash
# API Gateway
curl http://localhost:8080/health

# Billing Service
curl http://localhost:8090/actuator/health

# Appointment Service
curl http://localhost:8091/health
```

---

## 🎯 Test Case 1: Tạo Payment cho Appointment Fee

### **Request:**
```bash
curl -X POST http://localhost:8080/v1/billing/billings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "paymentType": "APPOINTMENT_FEE",
    "referenceId": "APPOINTMENT_123456",
    "amount": 200000,
    "paymentMethod": "MOMO"
  }'
```

### **Expected Response:**
```json
{
  "id": 1,
  "paymentCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paymentType": "APPOINTMENT_FEE",
  "referenceId": "APPOINTMENT_123456",
  "prescriptionId": null,
  "amount": 200000,
  "status": "PROCESSING",
  "paymentMethod": "MOMO",
  "paymentUrl": "https://test-payment.momo.vn/v2/gateway/app/...",
  "createdAt": "2025-10-16T15:30:00",
  "expiredAt": "2025-10-16T15:45:00"
}
```

### **Verify in Database:**
```sql
SELECT * FROM payments WHERE reference_id = 'APPOINTMENT_123456';

-- Expected:
-- payment_type: APPOINTMENT_FEE
-- reference_id: APPOINTMENT_123456
-- status: PROCESSING
```

---

## 🎯 Test Case 2: Thanh toán qua MoMo

### **Steps:**
1. Copy `paymentUrl` từ response Test Case 1
2. Mở URL trong browser
3. Scan QR code bằng MoMo app (hoặc dùng test credentials)
4. Hoàn tất thanh toán

### **Expected Behavior:**
- MoMo redirect về return URL: `https://xxx.devtunnels.ms/v1/billing/billings/return?...`
- Billing Service nhận IPN/Return callback
- Payment status updated to `COMPLETED`

### **Verify Logs:**
```bash
# Trong billing service logs:
INFO - Received return from payment gateway. Params: {orderId=..., resultCode=0, ...}
INFO - Processing return as fallback IPN for gateway: momo
INFO - Payment a1b2c3d4-... COMPLETED via MOMO IPN.
INFO - Notifying Appointment Service for payment a1b2c3d4-...
INFO - Payment a1b2c3d4-... updated to status: COMPLETED
```

### **Verify in Database:**
```sql
SELECT * FROM payments WHERE payment_code = 'a1b2c3d4-...';

-- Expected:
-- status: COMPLETED
-- transaction_id: <MoMo transaction ID>
-- updated_at: <timestamp>
```

---

## 🎯 Test Case 3: Appointment Service nhận thông báo

### **Expected (khi Appointment Service đã implement):**

**Appointment Service Logs:**
```
INFO - Received payment confirmation for appointment: APPOINTMENT_123456
INFO - Updating appointment payment status to PAID
INFO - Sending notification to patient about payment confirmation
```

**Database:**
```sql
-- Trong appointment database
SELECT * FROM appointments WHERE id = 'APPOINTMENT_123456';

-- Expected:
-- payment_status: PAID
-- payment_id: a1b2c3d4-...
-- paid_amount: 200000
-- paid_at: <timestamp>
-- status: CONFIRMED (nếu trước đó là PENDING)
```

---

## 🎯 Test Case 4: Test với Lab Test Payment

### **Request:**
```bash
curl -X POST http://localhost:8080/v1/billing/billings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "paymentType": "LAB_TEST",
    "referenceId": "LAB_TEST_789",
    "amount": 500000,
    "paymentMethod": "VNPAY"
  }'
```

### **Expected:**
- Payment created với `paymentType: LAB_TEST`
- `orderInfo`: "Thanh toan xet nghiem - LAB_TEST_789"
- Payment URL từ VNPay

---

## 🎯 Test Case 5: Backward Compatibility (Code cũ)

### **Request với prescriptionId (deprecated):**
```bash
curl -X POST http://localhost:8080/v1/billing/billings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prescriptionId": "PRESCRIPTION_OLD_123",
    "amount": 120000,
    "paymentMethod": "MOMO"
  }'
```

### **Expected Error:**
```json
{
  "timestamp": "2025-10-16T15:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Payment type is required",
  "path": "/v1/billing/billings"
}
```

**Note:** Code cũ KHÔNG còn hoạt động vì `paymentType` là required field!

---

## 🎯 Test Case 6: Validation Errors

### **Test 6.1: Missing paymentType**
```bash
curl -X POST http://localhost:8080/v1/billing/billings \
  -H "Content-Type: application/json" \
  -d '{
    "referenceId": "APPOINTMENT_123",
    "amount": 200000,
    "paymentMethod": "MOMO"
  }'
```

**Expected:**
```json
{
  "error": "Validation failed",
  "message": "Payment type is required"
}
```

### **Test 6.2: Invalid amount (negative)**
```bash
curl -X POST http://localhost:8080/v1/billing/billings \
  -H "Content-Type: application/json" \
  -d '{
    "paymentType": "APPOINTMENT_FEE",
    "referenceId": "APPOINTMENT_123",
    "amount": -100,
    "paymentMethod": "MOMO"
  }'
```

**Expected:**
```json
{
  "error": "Validation failed",
  "message": "Amount must be positive"
}
```

---

## 🎯 Test Case 7: Query Payments

### **Get Payment by ID:**
```bash
curl http://localhost:8080/v1/billing/billings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Get Payment by Reference ID (NEW):**
```bash
# Cần implement endpoint mới trong BillingController
GET /api/v1/billings/reference/{referenceId}
```

---

## 🎯 Test Case 8: IPN Idempotency

### **Scenario:** MoMo gửi IPN 2 lần cho cùng 1 payment

**First IPN:**
```bash
curl -X POST http://localhost:8080/v1/billing/billings/ipn/momo \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "a1b2c3d4-...",
    "resultCode": "0",
    "message": "Success",
    "transId": "12345678"
  }'
```

**Response:**
```json
{
  "message": "IPN processed successfully"
}
```

**Second IPN (duplicate):**
```bash
# Gửi lại request giống hệt
```

**Expected Logs:**
```
WARN - MOMO IPN already processed for payment code: a1b2c3d4-...
```

**Response:**
```json
{
  "message": "IPN processed successfully"
}
```

**Database:** Status vẫn là COMPLETED, không có thay đổi

---

## 🎯 Test Case 9: Payment Expiration

### **Steps:**
1. Tạo payment
2. Đợi > 15 phút (hoặc set expiredAt ngắn hơn)
3. Thử thanh toán payment đã hết hạn

**Expected:**
- MoMo/VNPay có thể reject payment
- Billing Service cần check expiredAt trước khi process IPN

**TODO:** Implement expired payment handling

---

## 🎯 Test Case 10: Error Handling

### **Test 10.1: Appointment Service Down**

**Steps:**
1. Stop Appointment Service
2. Tạo payment và thanh toán thành công
3. Check logs

**Expected Logs:**
```
INFO - Payment a1b2c3d4-... COMPLETED via MOMO IPN.
INFO - Notifying Appointment Service for payment a1b2c3d4-...
WARN - AppointmentServiceClient not available, skipping notification
INFO - Payment a1b2c3d4-... updated to status: COMPLETED
```

**Important:** Payment vẫn được mark COMPLETED, notification failure KHÔNG rollback payment!

### **Test 10.2: Invalid Signature**

```bash
curl -X POST http://localhost:8080/v1/billing/billings/ipn/momo \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "a1b2c3d4-...",
    "resultCode": "0",
    "signature": "INVALID_SIGNATURE_HERE"
  }'
```

**Expected:**
```json
{
  "error": "Failed to process IPN: Invalid MOMO IPN signature."
}
```

---

## 📊 Performance Testing

### **Load Test với Artillery:**

```yaml
# artillery-load-test.yml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "Create Payment"
    flow:
      - post:
          url: "/v1/billing/billings"
          headers:
            Content-Type: "application/json"
            Authorization: "Bearer YOUR_JWT_TOKEN"
          json:
            paymentType: "APPOINTMENT_FEE"
            referenceId: "APPOINTMENT_{{ $randomNumber() }}"
            amount: 200000
            paymentMethod: "MOMO"
```

**Run:**
```bash
artillery run artillery-load-test.yml
```

**Expected Metrics:**
- Response time p95 < 500ms
- Error rate < 1%
- Throughput > 100 req/s

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Payment type is required" error**
**Solution:** Đảm bảo request có field `paymentType` và `referenceId`

### **Issue 2: Appointment Service không nhận notification**
**Checklist:**
- ✅ Appointment Service đang chạy
- ✅ `appointment.service.url` config đúng
- ✅ Internal API endpoint đã implement
- ✅ Check logs của cả 2 services

### **Issue 3: Database schema không update**
**Solution:**
```bash
# Stop service
# Update application.properties:
spring.jpa.hibernate.ddl-auto=update

# Restart service - Hibernate sẽ tự động thêm columns
```

### **Issue 4: MoMo signature mismatch**
**Checklist:**
- ✅ `momo.secret-key` đúng
- ✅ rawData order đúng (accessKey, amount, extraData, ...)
- ✅ Check logs để so sánh generated signature vs received signature

---

## 📝 Test Checklist

### **Manual Testing:**
- [ ] Create payment với APPOINTMENT_FEE ✅
- [ ] Create payment với LAB_TEST ✅
- [ ] Thanh toán qua MoMo thành công ✅
- [ ] Thanh toán qua VNPay thành công ✅
- [ ] Appointment Service nhận notification ✅
- [ ] IPN idempotency hoạt động ✅
- [ ] Validation errors hiển thị đúng ✅
- [ ] Error handling khi service down ✅

### **Database Verification:**
- [ ] payment_type column tồn tại ✅
- [ ] reference_id column tồn tại ✅
- [ ] Data được lưu đúng format ✅

### **Integration Testing:**
- [ ] Billing ↔ Appointment communication ✅
- [ ] API Gateway routing đúng ✅
- [ ] MoMo IPN callback hoạt động ✅
- [ ] VNPay IPN callback hoạt động ✅

---

## 🚀 Next Steps

1. **Implement Appointment Service endpoints**
   - Follow guide trong `BILLING_INTEGRATION.md`

2. **Add Payment Expiration Handling**
   - Check `expiredAt` trước khi process IPN
   - Cron job để cleanup expired payments

3. **Add Refund Logic**
   - Implement refund khi appointment cancelled
   - Call MoMo/VNPay refund API

4. **Improve Error Handling**
   - Retry mechanism cho service communication
   - Dead letter queue cho failed notifications

5. **Performance Optimization**
   - Add caching cho payment lookup
   - Async processing cho notifications

---

**Created:** 2025-10-16  
**Last Updated:** 2025-10-16  
**Status:** ✅ Ready for Testing
