import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentProducerService } from './appointment-producer.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly producer: AppointmentProducerService,
  ) { }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // 1. Tạo record pending
    const appointment = this.appointmentRepo.create({
      ...dto,
      status: 'pending',
    });
    const saved = await this.appointmentRepo.save(appointment);

    // 2. Gửi event Kafka sang doctor-service
    await this.producer.requestBooking({
      id: saved.id,
      doctorId: dto.doctorId,
      slotId: dto.slotId,
      patientId: dto.patientId,
    });
    console.log("Request dc gửi sang doctor",saved)
    return saved;
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepo.find();
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found`);
    }
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
  async confirmAppointment(appointmentId: string, doctorId: string, slotId: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);

    appointment.status = 'confirmed';
    appointment.doctorId = doctorId;
    appointment.slotId = slotId;
    return this.appointmentRepo.save(appointment);
  }

  async failAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);

    appointment.status = 'failed';
    return this.appointmentRepo.save(appointment);
  }
}

