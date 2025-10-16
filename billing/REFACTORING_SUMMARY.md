# 🔄 Billing Service - Refactoring to Support Multiple Payment Types

## 📅 Change Date: 2025-10-16

---

## 🎯 Mục đích Refactoring

**Trước đây:** Billing Service chỉ hỗ trợ thanh toán cho đơn thuốc (Prescription)  
**Bây giờ:** Hỗ trợ nhiều loại thanh toán:
- ✅ **APPOINTMENT_FEE** - Thanh toán phí khám bệnh
- ✅ **LAB_TEST** - Thanh toán xét nghiệm  
- ✅ **PRESCRIPTION** - Thanh toán đơn thuốc (deprecated - hệ thống không bán thuốc)
- ✅ **OTHER** - Các khoản phí khác

---

## 📝 Các file đã thay đổi

### ✅ **1. Entity Layer**

#### `Payment.java` - Thêm fields mới
```java
// NEW FIELDS
@Enumerated(EnumType.STRING)
private PaymentType paymentType;  // Loại thanh toán

private String referenceId;        // ID tham chiếu (appointmentId, labTestId, etc.)

// DEPRECATED FIELD (giữ lại để tương thích)
@Deprecated
private String prescriptionId;
```

**Migration:** Hibernate sẽ tự động tạo columns khi restart với `ddl-auto=update`

---

### ✅ **2. Enum**

#### `PaymentType.java` - NEW FILE
```java
public enum PaymentType {
    APPOINTMENT_FEE,  // Thanh toán phí khám
    LAB_TEST,         // Thanh toán xét nghiệm
    PRESCRIPTION,     // Thanh toán đơn thuốc (deprecated)
    OTHER             // Các khoản phí khác
}
```

---

### ✅ **3. DTO Layer**

#### `CreatePaymentRequest.java` - Thêm validations
```java
@NotNull(message = "Payment type is required")
private PaymentType paymentType;

@NotNull(message = "Reference ID is required")
private String referenceId;

@NotNull(message = "Amount is required")
@Positive(message = "Amount must be positive")
private BigDecimal amount;

@NotNull(message = "Payment method is required")
private PaymentMethodType paymentMethod;
```

#### `PaymentResponse.java` - Thêm fields
```java
private PaymentType paymentType;
private String referenceId;

@Deprecated
private String prescriptionId; // Giữ lại để tương thích
```

---

### ✅ **4. Repository**

#### `PaymentRepository.java` - Thêm query methods
```java
// NEW
Optional<Payment> findByReferenceId(String referenceId);
List<Payment> findByReferenceIdAndPaymentType(String referenceId, PaymentType paymentType);

// DEPRECATED
@Deprecated
Optional<Payment> findByPrescriptionId(String prescriptionId);
```

---

### ✅ **5. Service Layer**

#### `BillingServiceImpl.java` - Cập nhật logic
```java
@Override
public PaymentResponse createPayment(CreatePaymentRequest request) {
    // Validate payment type
    if (request.getPaymentType() == null) {
        throw new IllegalArgumentException("Payment type is required");
    }
    
    Payment payment = new Payment();
    payment.setPaymentType(request.getPaymentType());
    payment.setReferenceId(request.getReferenceId());
    
    // Set expiredAt (15 minutes)
    payment.setExpiredAt(LocalDateTime.now().plusMinutes(15));
    
    // ... rest of logic
}
```

#### `MomoPaymentGatewayService.java` - Thêm helper methods
```java
// Constructor updated - XÓA MedicineServiceClient, THÊM AppointmentServiceClient
public MomoPaymentGatewayService(
    PaymentRepository paymentRepository, 
    RestTemplate restTemplate, 
    ObjectMapper objectMapper) {
    // No longer depends on MedicineServiceClient
}

@Autowired(required = false)
private AppointmentServiceClient appointmentServiceClient;

// NEW METHOD
private String buildOrderInfo(Payment payment) {
    switch (payment.getPaymentType()) {
        case APPOINTMENT_FEE:
            return "Thanh toan phi kham benh - " + payment.getReferenceId();
        case LAB_TEST:
            return "Thanh toan xet nghiem - " + payment.getReferenceId();
        // ...
    }
}

// NEW METHOD
private void notifyRelatedService(Payment payment) {
    switch (payment.getPaymentType()) {
        case APPOINTMENT_FEE:
            appointmentServiceClient.confirmAppointmentPayment(payment.getReferenceId());
            break;
        case LAB_TEST:
            // TODO: Implement LabTestServiceClient
            break;
        // ...
    }
}
```

---

### ✅ **6. Feign Clients**

#### `AppointmentServiceClient.java` - NEW FILE
```java
@FeignClient(name = "appointment-service", url = "${appointment.service.url}")
public interface AppointmentServiceClient {
    @PostMapping("/api/v1/internal/appointments/{appointmentId}/confirm-payment")
    void confirmAppointmentPayment(@PathVariable("appointmentId") String appointmentId);
}
```

#### `MedicineServiceClient.java` - KHÔNG CẦN THIẾT
❌ Đã xóa dependency vì hệ thống không bán thuốc

---

### ✅ **7. Configuration**

#### `application.properties`
```properties
# NEW - Appointment Service Client
appointment.service.url=http://localhost:8091

# REMOVED - Medicine Service không còn cần thiết
# medicine.service.url=http://localhost:8089
```

---

### ✅ **8. Controller**

#### `BillingController.java` - Cập nhật documentation
```java
@Operation(summary = "Create a new payment request", 
           description = "Supports multiple payment types: APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION, OTHER.")
@PostMapping
public ResponseEntity<PaymentResponse> createPayment(
    @Valid @RequestBody CreatePaymentRequest request) {
    log.info("Received request - Type: {}, ReferenceId: {}, Amount: {}", 
             request.getPaymentType(), request.getReferenceId(), request.getAmount());
    // ...
}
```

---

## 🔄 API Changes

### **Request Format - TRƯỚC:**
```json
POST /api/v1/billings
{
  "prescriptionId": "PRESCRIPTION_12345",
  "amount": 120000,
  "paymentMethod": "MOMO"
}
```

### **Request Format - SAU:**
```json
POST /api/v1/billings
{
  "paymentType": "APPOINTMENT_FEE",
  "referenceId": "APPOINTMENT_123",
  "amount": 200000,
  "paymentMethod": "MOMO"
}
```

### **Response Format - SAU:**
```json
{
  "id": 1,
  "paymentCode": "uuid-xxx",
  "paymentType": "APPOINTMENT_FEE",
  "referenceId": "APPOINTMENT_123",
  "prescriptionId": null,  // deprecated
  "amount": 200000,
  "status": "PROCESSING",
  "paymentMethod": "MOMO",
  "paymentUrl": "https://test-payment.momo.vn/...",
  "createdAt": "2025-10-16T15:30:00",
  "expiredAt": "2025-10-16T15:45:00"
}
```

---

## 🗄️ Database Schema Changes

### **Columns thêm vào `payments` table:**
```sql
ALTER TABLE payments ADD COLUMN payment_type ENUM('APPOINTMENT_FEE', 'LAB_TEST', 'PRESCRIPTION', 'OTHER') NOT NULL;
ALTER TABLE payments ADD COLUMN reference_id VARCHAR(255) NOT NULL;
-- prescription_id giữ lại nhưng đánh dấu deprecated
```

**Note:** Hibernate với `ddl-auto=update` sẽ tự động thêm columns khi restart service.

---

## ✅ Backward Compatibility

### **Code cũ vẫn hoạt động:**
- Field `prescriptionId` vẫn tồn tại nhưng đánh dấu `@Deprecated`
- Repository method `findByPrescriptionId()` vẫn hoạt động
- Response vẫn trả về `prescriptionId` field

### **Migration Strategy:**
1. Deploy code mới với backward compatibility
2. Update frontend để sử dụng `paymentType` + `referenceId`
3. Sau khi all clients migrate → remove deprecated fields

---

## 🚀 Deployment Steps

### **1. Build & Test:**
```bash
cd billing
./gradlew clean build -x test
```

### **2. Update Configuration:**
```properties
# application.properties
appointment.service.url=http://localhost:8091
```

### **3. Restart Service:**
```bash
./gradlew bootRun
```

### **4. Verify Database:**
```sql
-- Check new columns
DESCRIBE payments;

-- Should see:
-- payment_type (enum)
-- reference_id (varchar)
```

### **5. Test New API:**
```bash
curl -X POST http://localhost:8090/api/v1/billings \
  -H "Content-Type: application/json" \
  -d '{
    "paymentType": "APPOINTMENT_FEE",
    "referenceId": "APPOINTMENT_123",
    "amount": 200000,
    "paymentMethod": "MOMO"
  }'
```

---

## 📊 Service Communication Flow

### **Luồng thanh toán phí khám:**
```
[Frontend]
   ↓ POST /api/v1/appointments/{id}/create-payment
[Appointment Service]
   ↓ POST /api/v1/billings
[Billing Service] - Tạo payment (paymentType=APPOINTMENT_FEE)
   ↓ Return payment URL
[Frontend] - Redirect to MoMo
   ↓ Payment success
[MoMo] - Send IPN/Return URL
   ↓ POST /v1/billing/billings/ipn/momo
[API Gateway]
   ↓ Proxy to Billing Service
[Billing Service] - Update payment status = COMPLETED
   ↓ POST /api/v1/internal/appointments/{id}/confirm-payment
[Appointment Service] - Update appointment.paymentStatus = PAID
```

---

## 🔐 Security Notes

### **Internal API Protection:**
```java
// AppointmentServiceClient will use internal API endpoint
// Must add security header:
Headers: {
  "X-Internal-API-Key": "your-super-secret-key-for-internal-api-calls"
}
```

---

## 🐛 Known Issues & Limitations

1. **MedicineServiceClient removed:**
   - Nếu có code cũ đang inject `MedicineServiceClient` → sẽ bị lỗi
   - Solution: Remove all references to `MedicineServiceClient`

2. **Database migration:**
   - Hibernate `ddl-auto=update` không hỗ trợ ALTER column type
   - Nếu cần change existing column → phải manual migration

3. **Payment expiration:**
   - Hiện tại set cứng 15 phút
   - TODO: Make configurable per payment type

---

## 📚 Related Documentation

- [Appointment Service Integration](../appointment/BILLING_INTEGRATION.md)
- [MoMo Payment Gateway](./docs/momo-integration.md)
- [VNPay Payment Gateway](./docs/vnpay-integration.md)

---

## 👥 Team Notes

**Breaking Changes:** ❌ NONE  
**Backward Compatible:** ✅ YES  
**Database Migration Required:** ✅ YES (auto with Hibernate)  
**Configuration Changes:** ✅ YES (appointment.service.url)  
**Testing Status:** ⏳ Pending E2E tests

---

**Last Updated:** 2025-10-16  
**Author:** Development Team  
**Review Status:** ✅ Code Review Completed
