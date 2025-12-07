import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentProducerService } from 'src/kafka/appointment-producer.service';
import { HttpService } from '@nestjs/axios';
import { PaymentStatus } from './enums/payment-status.enum';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { FollowUpSuggestion } from '../follow-up-suggestion/follow-up-suggestion.entity';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly producer: AppointmentProducerService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentRepo.create({
      ...dto,
      status: AppointmentStatus.PENDING,
    });
    const saved = await this.appointmentRepo.save(appointment);

    await this.producer.requestBooking({
      id: saved.id,
      doctorId: dto.doctorId,
      slotId: dto.slotId,
      patientId: dto.patientId,
    });

    return saved;
  }

  async updatePatientId(appointmentId: string, patientId: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });
    if (!appointment)
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    appointment.patientId = patientId;
    return this.appointmentRepo.save(appointment);
  }

  async confirmAppointment(
    appointmentId: string,
    doctorId: string,
    slotId: string,
    patientId: string,
    patientName: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });
    if (!appointment)
      throw new NotFoundException(`Appointment ${appointmentId} not found`);

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.doctorId = doctorId;
    appointment.slotId = slotId;
    appointment.patientId = patientId;
    appointment.patientName = patientName;

    const saved = await this.appointmentRepo.save(appointment);

    const payload = {
      patientName: saved.doctorName,
      patientEmail: 'anh.ltl2511@gmail.com',
      doctorName: saved.doctorName,
      doctorEmail: 'huuvinh.lampart@gmail.com',
      appointmentTime: saved.startAt?.toISOString() ?? new Date().toISOString(),
      conversation: 'Mệt',
    };

    // this.http
    //   .post('http://localhost:5678/webhook-test/patient-appointment', payload)
    //   .subscribe({
    //     next: () => console.log('Webhook gửi thành công'),
    //     error: (err) => console.error(' Lỗi khi gọi webhook:', err.message),
    //   });

    return saved;
  }

  async failAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });
    if (!appointment)
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    appointment.status = AppointmentStatus.FAILED;
    return this.appointmentRepo.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepo.find();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment)
      throw new NotFoundException(`Appointment with id ${id} not found`);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    await this.findOne(id);
    await this.appointmentRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.appointmentRepo.delete(id);
  }
  async getAppointmentsByDoctor(
    doctorId: string,
    start?: string,
    end?: string,
  ): Promise<Appointment[]> {
    const qb = this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .orderBy('appointment.startAt', 'ASC');

    if (start && end) {
      qb.andWhere('appointment.startAt BETWEEN :start AND :end', {
        start: new Date(start),
        end: new Date(end),
      });
    }

    return qb.getMany();
  }
  async getAppointmentsByPatient(
    patientId: string,
    page = 1,
    limit = 3,
    search?: string,
    status?: 'confirmed' | 'completed' | 'cancelled' | 'all',
    dateRange?: 'today' | 'week' | 'month' | 'year' | 'all',
  ) {
    const qb = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.medicalRecord', 'medicalRecord')
      .leftJoinAndSelect('medicalRecord.vitalSigns', 'vitalSigns')
      .where('appointment.patientId = :patientId', { patientId })
      .orderBy('appointment.startAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(LOWER(appointment.doctorName) LIKE :search )', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    if (status && status !== 'all') {
      qb.andWhere('appointment.status = :status', { status });
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let start: Date;

      switch (dateRange) {
        case 'today':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          qb.andWhere('appointment.startAt BETWEEN :start AND :end', {
            start,
            end: new Date(now.setHours(23, 59, 59, 999)),
          });
          break;

        case 'week':
          start = this.getStartOfWeek(now);
          qb.andWhere('appointment.startAt >= :start', { start });
          break;

        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          qb.andWhere('appointment.startAt >= :start', { start });
          break;

        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          qb.andWhere('appointment.startAt >= :start', { start });
          break;
      }
    }

    const [appointments, total] = await qb.getManyAndCount();

    const appointmentsWithPatient = await Promise.all(
      appointments.map(async (appointment) => {
        let patientInfo = null;
        if (appointment.patientId) {
          try {
            const reply = await this.producer.requestPatientDetail(
              appointment.patientId,
            );
            patientInfo = reply?.patient ?? reply ?? null;
          } catch (err) {
            console.warn(
              `Không thể lấy thông tin patientId=${appointment.patientId}:`,
              err.message,
            );
          }
        }
        return {
          ...appointment,
          patient: patientInfo,
        };
      }),
    );

    return { appointments: appointmentsWithPatient, total, page, limit };
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  async getAppointmentDetail(id: string) {
    const appointment = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.medicalRecord', 'medicalRecord')
      .leftJoinAndSelect('medicalRecord.vitalSigns', 'vitalSigns')
      .where('appointment.id = :id', { id })
      .getOne();

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    let patientInfo = null;
    if (appointment.patientId) {
      try {
        const reply = await this.producer.requestPatientDetail(
          appointment.patientId,
        );
        patientInfo = reply?.patient ?? reply ?? null;
      } catch (err) {
        console.warn(
          `Không thể lấy thông tin patientId=${appointment.patientId}:`,
          err.message,
        );
      }
    }

    return {
      ...appointment,
      patient: patientInfo,
    };
  }

  /**
   * Tạo payment request cho appointment
   * Gọi Billing Service để tạo payment và nhận payment URL
   *
   * @param appointmentId - ID của appointment
   * @param dto - Payment method (MOMO | VNPAY)
   * @returns Payment response with paymentUrl
   */
  async createPaymentForAppointment(
    appointmentId: string,
    dto: CreatePaymentRequestDto,
  ) {
    // 1. Kiểm tra appointment tồn tại
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    // 2. Kiểm tra đã thanh toán chưa
    if (appointment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Appointment has already been paid');
    }

    // 3. Kiểm tra nếu đã có payment request pending
    if (
      appointment.paymentStatus === PaymentStatus.PENDING &&
      appointment.paymentId
    ) {
      this.logger.warn(
        `Appointment ${appointmentId} already has pending payment: ${appointment.paymentId}`,
      );
      // Có thể return existing payment hoặc tạo mới - tùy business logic
      // Ở đây chúng ta sẽ cho phép tạo payment mới
    }

    // 4. Gọi Billing Service
    const billingServiceUrl = this.configService.get<string>(
      'BILLING_SERVICE_URL',
    );

    if (!billingServiceUrl) {
      throw new Error('BILLING_SERVICE_URL is not configured');
    }

    try {
      this.logger.log(
        `Creating payment for appointment ${appointmentId} with ${dto.paymentMethod}`,
      );

      const response = await firstValueFrom(
        this.http.post(`${billingServiceUrl}/api/v1/billings`, {
          paymentType: 'APPOINTMENT_FEE',
          referenceId: appointmentId,
          amount: appointment.consultationFee || 200000,
          paymentMethod: dto.paymentMethod,
        }),
      );

      const paymentData = response.data;

      // 5. Cập nhật appointment với payment info
      appointment.paymentStatus = PaymentStatus.PENDING;
      appointment.paymentId = paymentData.paymentCode;
      appointment.paymentUrl = paymentData.paymentUrl;
      await this.appointmentRepo.save(appointment);

      this.logger.log(
        `Payment created successfully for appointment ${appointmentId}, paymentId: ${paymentData.paymentCode}`,
      );

      return {
        success: true,
        appointmentId,
        paymentId: paymentData.paymentCode,
        paymentUrl: paymentData.paymentUrl,
        amount: paymentData.amount,
        expiredAt: paymentData.expiredAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create payment for appointment ${appointmentId}`,
        error.stack,
      );

      // Handle specific errors
      if (error.response) {
        throw new BadRequestException(
          `Billing Service error: ${error.response.data?.message || error.message}`,
        );
      }

      if (error.code === 'ECONNREFUSED') {
        throw new BadRequestException(
          'Billing Service is currently unavailable. Please try again later.',
        );
      }

      throw new BadRequestException(
        'Failed to create payment. Please try again later.',
      );
    }
  }

  /**
   * Xác nhận thanh toán cho appointment
   * Được gọi bởi Billing Service thông qua Internal API
   * Implements idempotency - có thể gọi nhiều lần mà không gây lỗi
   *
   * @param appointmentId - ID của appointment
   * @param paymentData - Thông tin thanh toán (paymentId, amount)
   */
  async confirmPayment(
    appointmentId: string,
    paymentData?: ConfirmPaymentDto,
  ): Promise<void> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    // Idempotency check: Nếu đã thanh toán rồi thì bỏ qua
    if (appointment.paymentStatus === PaymentStatus.PAID) {
      this.logger.warn(
        `Appointment ${appointmentId} already paid, skipping duplicate confirmation`,
      );
      return;
    }

    // Cập nhật payment status
    appointment.paymentStatus = PaymentStatus.PAID;
    if (paymentData?.paymentId) {
      appointment.paymentId = paymentData.paymentId;
    }
    appointment.paidAmount = paymentData?.amount || appointment.consultationFee;
    appointment.paidAt = new Date();

    // Tự động confirm appointment khi đã thanh toán
    if (appointment.status === AppointmentStatus.PENDING) {
      appointment.status = AppointmentStatus.CONFIRMED;
      this.logger.log(
        `Auto-confirmed appointment ${appointmentId} after payment`,
      );
    }

    await this.appointmentRepo.save(appointment);

    this.logger.log(
      `Payment confirmed for appointment ${appointmentId}, amount: ${appointment.paidAmount}`,
    );

    // TODO: Gửi notification cho bệnh nhân (email/SMS)
    // await this.notificationService.sendPaymentConfirmation(appointment);
  }

  /**
   * Check-in bệnh nhân tại cơ sở y tế
   * ✅ KHÔNG YÊU CẦU thanh toán trước - Cho phép check-in và thanh toán sau khi khám
   *
   * @param appointmentId - ID của appointment
   * @param dto - Check-in data (optional notes)
   */
  async checkIn(appointmentId: string, dto?: CheckInDto) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    // 1. ❌ BỎ VALIDATION PAYMENT - Cho phép check-in dù chưa thanh toán
    // Payment sẽ được thực hiện SAU KHI KHÁM để tính đúng tổng chi phí
    // if (appointment.paymentStatus !== PaymentStatus.PAID) {
    //   throw new BadRequestException(
    //     `Payment required. Appointment payment status is ${appointment.paymentStatus}`,
    //   );
    // }

    // 2. Kiểm tra đã check-in chưa
    if (appointment.checkedInAt) {
      this.logger.warn(
        `Appointment ${appointmentId} already checked in at ${appointment.checkedInAt}`,
      );
      throw new BadRequestException('Appointment has already been checked in');
    }

    // 3. Ghi nhận thời gian check-in
    const now = new Date();
    const appointmentTime = new Date(appointment.startAt);

    // TODO: Re-enable time validation after testing
    // const hoursDiff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    // // Không check-in quá sớm (> 2 giờ trước)
    // if (hoursDiff > 2) {
    //   throw new BadRequestException(
    //     `Too early to check in. Appointment is scheduled for ${appointmentTime.toLocaleString()}`,
    //   );
    // }
    // // Không check-in quá muộn (> 30 phút sau giờ hẹn)
    // if (hoursDiff < -0.5) {
    //   throw new BadRequestException(
    //     `Too late to check in. Appointment was scheduled for ${appointmentTime.toLocaleString()}`,
    //   );
    // }

    // 4. Chuẩn bị ghi chú
    let checkInNotes = dto?.notes || '';

    // ⚠️ Ghi chú nếu chưa thanh toán - để tracking
    if (appointment.paymentStatus !== PaymentStatus.PAID) {
      checkInNotes =
        `[CHƯA THANH TOÁN - Thu tiền sau khi khám] ${checkInNotes}`.trim();
      this.logger.warn(
        `Check-in appointment ${appointmentId} without payment. Status: ${appointment.paymentStatus}`,
      );
    }

    // 5. Update status và thời gian check-in
    appointment.status = AppointmentStatus.CHECKED_IN;
    appointment.checkedInAt = now; // ✅ Cập nhật thời gian check-in chính xác
    appointment.notes = checkInNotes;

    this.logger.log(`📝 BEFORE SAVE - Appointment ${appointmentId}:`);
    this.logger.log(`   - status: ${appointment.status}`);
    this.logger.log(
      `   - checkedInAt: ${appointment.checkedInAt?.toISOString()}`,
    );
    this.logger.log(`   - paymentStatus: ${appointment.paymentStatus}`);

    await this.appointmentRepo.save(appointment);

    // ✅ Verify sau khi save
    const savedAppointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });
    this.logger.log(`✅ AFTER SAVE - Verified from DB:`);
    this.logger.log(
      `   - checkedInAt in DB: ${savedAppointment?.checkedInAt?.toISOString()}`,
    );

    this.logger.log(
      `✅ Appointment ${appointmentId} checked in successfully at ${now.toISOString()}. Payment status: ${appointment.paymentStatus}`,
    );

    return {
      success: true,
      message: 'Checked in successfully',
      appointmentId,
      checkedInAt: now, // ✅ Trả về thời gian check-in chính xác
      paymentStatus: appointment.paymentStatus, // ✅ Trả về payment status để frontend biết
      requiresPayment: appointment.paymentStatus !== PaymentStatus.PAID, // ✅ Flag để frontend hiển thị warning
      appointment,
    };
  }

  async getPreviousAppointment(appointmentId: string) {
    const currentAppointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['followUpSuggestion'],
    });

    if (!currentAppointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    const followUpId =
      currentAppointment.followUpId ||
      currentAppointment.followUpSuggestion?.id;
    if (!followUpId) {
      throw new NotFoundException(
        `Appointment ${appointmentId} is not a follow-up`,
      );
    }

    const followUpRepo =
      this.appointmentRepo.manager.getRepository(FollowUpSuggestion);
    const followUp = await followUpRepo.findOne({
      where: { id: followUpId },
      relations: [
        'medicalRecord',
        'medicalRecord.vitalSigns',
        'medicalRecord.appointment',
      ],
    });

    if (!followUp?.medicalRecord?.appointment) {
      throw new NotFoundException(
        `Previous appointment not found for follow-up ${followUpId}`,
      );
    }

    const previousAppointment = await this.appointmentRepo.findOne({
      where: { id: followUp.medicalRecord.appointment.id },
      relations: ['medicalRecord', 'medicalRecord.vitalSigns'],
    });

    return previousAppointment;
  }
  /**
   * ========================================
   * RECEPTIONIST METHODS
   * ========================================
   */

  /**
   * Lấy danh sách appointments hôm nay (cho màn hình check-in của Receptionist)
   * @param filters - Lọc theo status, paymentStatus
   * @param filters.daysOffset - For testing: 0=today, 1=tomorrow, -1=yesterday
   */
  async getTodayAppointments(filters?: {
    status?: string;
    paymentStatus?: string;
    daysOffset?: number;
  }): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply offset for testing (e.g., daysOffset=1 for tomorrow)
    if (filters?.daysOffset) {
      today.setDate(today.getDate() + filters.daysOffset);
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queryBuilder = this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.startAt >= :today', { today })
      .andWhere('appointment.startAt < :tomorrow', { tomorrow })
      .orderBy('appointment.startAt', 'ASC');

    if (filters?.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.paymentStatus) {
      queryBuilder.andWhere('appointment.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Tìm kiếm appointment để check-in (theo mã/tên/SĐT)
   * @param keyword - Từ khóa tìm kiếm
   */
  async searchForReceptionist(keyword: string): Promise<Appointment[]> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('Keyword is required');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.appointmentRepo
      .createQueryBuilder('appointment')
      .where('appointment.startAt >= :today', { today })
      .andWhere(
        '(appointment.id LIKE :keyword OR appointment.patientName LIKE :keyword OR appointment.patientId LIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
      .orderBy('appointment.startAt', 'ASC')
      .limit(20)
      .getMany();
  }

  /**
   * Cập nhật status của appointment (cho Receptionist/Doctor)
   * @param appointmentId - ID của appointment
   * @param newStatus - Status mới
   */
  async updateStatus(
    appointmentId: string,
    newStatus: string,
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    appointment.status = newStatus as any;

    // Cập nhật checkedInAt khi status = CHECKED_IN
    if (newStatus === AppointmentStatus.CHECKED_IN) {
      appointment.checkedInAt = new Date();
      this.logger.log(`Setting checkedInAt for appointment ${appointmentId}`);
    }

    await this.appointmentRepo.save(appointment);

    this.logger.log(
      `Appointment ${appointmentId} status updated to ${newStatus}`,
    );

    return appointment;
  }
}
