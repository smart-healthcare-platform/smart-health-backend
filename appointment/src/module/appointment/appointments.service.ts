import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentProducerService } from './appointment-producer.service';
import { NotificationService } from '../notification/notification.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly producer: AppointmentProducerService,
    private readonly notificationService: NotificationService,
    private readonly http: HttpService,
  ) { }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentRepo.create({ ...dto, status: 'pending' });
    const saved = await this.appointmentRepo.save(appointment);

    await this.producer.requestBooking({
      id: saved.id,
      doctorId: dto.doctorId,
      slotId: dto.slotId,
      userId: dto.userId,
    });

    return saved;
  }

  async updatePatientId(appointmentId: string, patientId: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);
    appointment.patientId = patientId;
    return this.appointmentRepo.save(appointment);
  }

  async confirmAppointment(
    appointmentId: string,
    doctorId: string,
    slotId: string,
    patientId: string,
    patientName: string
  ) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);

    appointment.status = 'confirmed';
    appointment.doctorId = doctorId;
    appointment.slotId = slotId;
    appointment.patientId = patientId;
    appointment.patientName = patientName;

    const saved = await this.appointmentRepo.save(appointment);

    const payload = {
      patientName: saved.doctorName, // TODO: lấy từ Patient entity
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


    this.notificationService
      .notifyAppointmentConfirmation(payload)
      .then(() => console.log('Email gửi thành công'))
      .catch((err) => console.error(' Lỗi khi gửi email:', err.message));

    return saved;
  }


  async failAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);
    appointment.status = 'failed';
    return this.appointmentRepo.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepo.find();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Appointment with id ${id} not found`);
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
          qb.andWhere(
            'appointment.startAt BETWEEN :start AND :end',
            { start, end: new Date(now.setHours(23, 59, 59, 999)) }
          );
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

    return { appointments, total, page, limit };
  }


  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  async getAppointmentDetail(id: string) {
    const appointment = await this.findOne(id);
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);

    let patientInfo = null;
    if (appointment.patientId) {
      try {
        const reply = await this.producer.requestPatientDetail(appointment.patientId);
        patientInfo = reply?.patient ?? reply ?? null;
      } catch (err) {
        console.warn(`Không thể lấy thông tin patientId=${appointment.patientId}:`, err.message);
      }
    }

    return {
      ...appointment,
      patient: patientInfo,
    };
  }
}
