# 📋 Tích hợp Billing Service với Appointment Service

## 🎯 Mục tiêu
Xây dựng luồng thanh toán phí khám bệnh trước cho bệnh nhân dựa trên lịch hẹn (Appointment).

---

## 🔄 Luồng nghiệp vụ

### **Tổng quan:**
```
1. Bệnh nhân đặt lịch khám
   ↓
   [Appointment Service] Tạo appointment (status: PENDING)

2. Bệnh nhân thanh toán phí khám (200k)
   ↓
   [Frontend] Gọi Billing Service API
   ↓
   [Billing Service] Tạo Payment (paymentType: APPOINTMENT_FEE)
   ↓
   [MoMo/VNPay] Redirect bệnh nhân đến trang thanh toán

3. Bệnh nhân thanh toán thành công
   ↓
   [MoMo/VNPay] Gửi IPN hoặc Return URL
   ↓
   [Billing Service] Cập nhật Payment status → COMPLETED
   ↓
   [Billing Service] Gọi Appointment Service Internal API
   ↓
   🔔 [Appointment Service] Cập nhật appointment status → PAID

4. Bệnh nhân đến cơ sở y tế
   ↓
   [Appointment Service] Check-in (QR code / mã appointment)
   ↓
   [Appointment Service] Verify payment_status = PAID
   ↓
   Cho vào khám (update status → IN_PROGRESS)

5. Sau khi khám xong
   ↓
   [Appointment Service] Update status → COMPLETED
```

---

## 🛠️ Công việc cần thực hiện

### ✅ **Task 1: Cập nhật Appointment Entity**

**File:** `src/module/appointment/entities/appointment.entity.ts`

**Thêm các field:**
```typescript
@Entity('appointments')
export class Appointment {
  // ... existing fields ...

  @Column({ 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.UNPAID 
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentId: string; // Payment code từ Billing Service

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount: number; // Số tiền đã thanh toán

  @Column({ nullable: true })
  paidAt: Date; // Thời gian thanh toán
}
```

**Tạo PaymentStatus enum:**
```typescript
// src/module/appointment/enums/payment-status.enum.ts
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}
```

---

### ✅ **Task 2: Tạo Internal API Endpoint**

**File:** `src/module/appointment/controllers/internal-appointment.controller.ts`

**Tạo controller mới cho internal APIs:**
```typescript
import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from '@/common/guards/internal-api.guard';
import { AppointmentService } from '../services/appointment.service';

@Controller('api/v1/internal/appointments')
@UseGuards(InternalApiGuard) // Guard để verify internal calls
export class InternalAppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Endpoint được gọi bởi Billing Service khi thanh toán thành công
   * POST /api/v1/internal/appointments/{appointmentId}/confirm-payment
   */
  @Post(':appointmentId/confirm-payment')
  async confirmPayment(
    @Param('appointmentId') appointmentId: string,
    @Body() paymentData?: { paymentId?: string; amount?: number }
  ) {
    return this.appointmentService.confirmPayment(appointmentId, paymentData);
  }
}
```

---

### ✅ **Task 3: Implement Business Logic**

**File:** `src/module/appointment/services/appointment.service.ts`

**Thêm method:**
```typescript
async confirmPayment(
  appointmentId: string, 
  paymentData?: { paymentId?: string; amount?: number }
): Promise<void> {
  const appointment = await this.appointmentRepository.findOne({
    where: { id: appointmentId }
  });

  if (!appointment) {
    throw new NotFoundException(`Appointment ${appointmentId} not found`);
  }

  // Kiểm tra trùng lặp (idempotency)
  if (appointment.paymentStatus === PaymentStatus.PAID) {
    this.logger.warn(`Appointment ${appointmentId} already paid, skipping`);
    return;
  }

  // Cập nhật payment status
  appointment.paymentStatus = PaymentStatus.PAID;
  appointment.paymentId = paymentData?.paymentId;
  appointment.paidAmount = paymentData?.amount;
  appointment.paidAt = new Date();
  
  // Tự động confirm appointment khi đã thanh toán
  if (appointment.status === AppointmentStatus.PENDING) {
    appointment.status = AppointmentStatus.CONFIRMED;
  }

  await this.appointmentRepository.save(appointment);

  // Gửi notification cho bệnh nhân
  await this.notificationService.sendPaymentConfirmation(appointment);
  
  this.logger.log(`Payment confirmed for appointment ${appointmentId}`);
}
```

---

### ✅ **Task 4: Tạo Internal API Guard**

**File:** `src/common/guards/internal-api.guard.ts`

**Tạo guard để verify internal calls:**
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-internal-api-key'];
    const expectedKey = this.configService.get<string>('INTERNAL_API_SECRET_KEY');

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
```

**Cập nhật `.env`:**
```env
INTERNAL_API_SECRET_KEY=your-super-secret-key-for-internal-api-calls
```

---

### ✅ **Task 5: Cập nhật AppointmentModule**

**File:** `src/module/appointment/appointment.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentController } from './controllers/appointment.controller';
import { InternalAppointmentController } from './controllers/internal-appointment.controller';
import { AppointmentService } from './services/appointment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [
    AppointmentController,
    InternalAppointmentController // Thêm internal controller
  ],
  providers: [AppointmentService],
  exports: [AppointmentService]
})
export class AppointmentModule {}
```

---

### ✅ **Task 6: Thêm API tạo payment từ Appointment**

**File:** `src/module/appointment/controllers/appointment.controller.ts`

**Thêm endpoint:**
```typescript
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('api/v1/appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Tạo payment cho appointment
   * POST /api/v1/appointments/{id}/create-payment
   */
  @Post(':id/create-payment')
  async createPayment(
    @Param('id') appointmentId: string,
    @Body() paymentRequest: { paymentMethod: 'MOMO' | 'VNPAY' }
  ) {
    const appointment = await this.appointmentService.findOne(appointmentId);
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Appointment already paid');
    }

    // Gọi Billing Service để tạo payment
    const billingServiceUrl = this.configService.get<string>('BILLING_SERVICE_URL');
    const response = await firstValueFrom(
      this.httpService.post(`${billingServiceUrl}/api/v1/billings`, {
        paymentType: 'APPOINTMENT_FEE',
        referenceId: appointmentId,
        amount: appointment.consultationFee, // hoặc giá cố định
        paymentMethod: paymentRequest.paymentMethod
      })
    );

    // Cập nhật appointment với payment info
    appointment.paymentStatus = PaymentStatus.PENDING;
    appointment.paymentId = response.data.paymentCode;
    await this.appointmentService.update(appointmentId, appointment);

    return response.data; // Trả về payment URL
  }
}
```

**Cập nhật `.env`:**
```env
BILLING_SERVICE_URL=http://localhost:8090
```

**Cập nhật `appointment.module.ts`:**
```typescript
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    HttpModule // Thêm HttpModule để gọi external APIs
  ],
  // ... rest
})
```

---

### ✅ **Task 7: Migration Database**

**Tạo migration:**
```bash
npm run migration:generate -- -n AddPaymentFieldsToAppointment
```

**Hoặc thủ công:**
```typescript
// migrations/xxxx-add-payment-fields-to-appointment.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentFieldsToAppointment1697451234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('appointments', [
      new TableColumn({
        name: 'payment_status',
        type: 'enum',
        enum: ['UNPAID', 'PENDING', 'PAID', 'REFUNDED'],
        default: "'UNPAID'"
      }),
      new TableColumn({
        name: 'payment_id',
        type: 'varchar',
        isNullable: true
      }),
      new TableColumn({
        name: 'paid_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true
      }),
      new TableColumn({
        name: 'paid_at',
        type: 'timestamp',
        isNullable: true
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('appointments', [
      'payment_status',
      'payment_id', 
      'paid_amount',
      'paid_at'
    ]);
  }
}
```

**Chạy migration:**
```bash
npm run migration:run
```

---

### ✅ **Task 8: Cập nhật Check-in Logic**

**File:** `src/module/appointment/services/appointment.service.ts`

**Thêm method check-in:**
```typescript
async checkIn(appointmentId: string): Promise<Appointment> {
  const appointment = await this.findOne(appointmentId);

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  // Verify đã thanh toán
  if (appointment.paymentStatus !== PaymentStatus.PAID) {
    throw new BadRequestException('Appointment payment not completed');
  }

  // Verify appointment date (không check-in quá sớm)
  const appointmentDate = new Date(appointment.appointmentDate);
  const now = new Date();
  const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 2) {
    throw new BadRequestException('Too early to check-in');
  }

  // Update status
  appointment.status = AppointmentStatus.IN_PROGRESS;
  appointment.checkedInAt = new Date();

  return this.appointmentRepository.save(appointment);
}
```

---

## 🧪 Testing Checklist

### **Unit Tests:**
- [ ] Test confirmPayment() với appointment hợp lệ
- [ ] Test confirmPayment() với appointment đã paid (idempotency)
- [ ] Test confirmPayment() với appointment không tồn tại
- [ ] Test InternalApiGuard với valid/invalid API key
- [ ] Test checkIn() với payment status khác nhau

### **Integration Tests:**
- [ ] Test luồng: Tạo appointment → Tạo payment → Confirm payment → Check-in
- [ ] Test gọi Billing Service API từ Appointment Service
- [ ] Test Billing Service gọi Internal API của Appointment Service

### **E2E Tests:**
```bash
# Test full flow
1. POST /api/v1/appointments - Tạo appointment
2. POST /api/v1/appointments/{id}/create-payment - Tạo payment
3. Thanh toán trên MoMo
4. Verify appointment.paymentStatus = PAID
5. POST /api/v1/appointments/{id}/check-in - Check-in
6. Verify appointment.status = IN_PROGRESS
```

---

## 📊 Database Schema

```sql
-- Appointment table sau khi migration
CREATE TABLE appointments (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  
  -- Payment fields
  payment_status ENUM('UNPAID', 'PENDING', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
  payment_id VARCHAR(255),
  paid_amount DECIMAL(10, 2),
  paid_at TIMESTAMP,
  
  -- Other fields
  consultation_fee DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔗 API Endpoints Summary

### **Public APIs (từ Frontend):**
```
POST   /api/v1/appointments                          - Tạo appointment
GET    /api/v1/appointments/{id}                     - Xem appointment
POST   /api/v1/appointments/{id}/create-payment      - Tạo payment
POST   /api/v1/appointments/{id}/check-in            - Check-in
```

### **Internal APIs (từ Billing Service):**
```
POST   /api/v1/internal/appointments/{id}/confirm-payment
Header: X-Internal-API-Key: your-super-secret-key-for-internal-api-calls
Body: { "paymentId": "uuid", "amount": 200000 }
```

---

## 🚀 Deployment Notes

### **Environment Variables:**
```env
# Appointment Service
BILLING_SERVICE_URL=http://localhost:8090
INTERNAL_API_SECRET_KEY=your-super-secret-key-for-internal-api-calls

# Billing Service
APPOINTMENT_SERVICE_URL=http://localhost:8091
```

### **Port Configuration:**
- Appointment Service: `8091`
- Billing Service: `8090`
- API Gateway: `8080`

### **Restart Services sau khi deploy:**
```bash
# Restart Billing Service
cd billing
./gradlew bootRun

# Restart Appointment Service
cd appointment
npm run start:dev
```

---

## 📝 Notes

1. **Idempotency:** Endpoint `confirm-payment` phải handle duplicate calls (MoMo có thể gửi IPN nhiều lần)
2. **Error Handling:** Nếu Appointment Service down, Billing Service vẫn lưu payment COMPLETED
3. **Retry Mechanism:** Cân nhắc thêm retry logic hoặc message queue cho production
4. **Security:** Internal API phải verify API key để tránh unauthorized access
5. **Transaction:** Cân nhắc sử dụng distributed transaction hoặc saga pattern cho consistency

---

## 🔄 Future Improvements

1. **Event-Driven Architecture:**
   - Sử dụng Kafka/RabbitMQ thay vì HTTP call trực tiếp
   - Billing Service publish `PaymentCompletedEvent`
   - Appointment Service subscribe và xử lý

2. **Webhook Retry:**
   - Thêm retry mechanism nếu Appointment Service unavailable
   - Store failed webhooks và retry sau

3. **Payment Refund:**
   - Implement refund logic khi appointment bị cancel
   - Call Billing Service để process refund

4. **QR Code Check-in:**
   - Generate QR code chứa appointmentId + signature
   - Scan QR để check-in tự động

---

**Created:** 2025-10-16  
**Author:** Billing Integration Team  
**Status:** ✅ Ready for Implementation
