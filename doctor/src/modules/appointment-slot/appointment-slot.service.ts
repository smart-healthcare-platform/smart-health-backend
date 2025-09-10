import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSlot } from './appointment-slot.entity';
import { CreateDoctorAppoinmentSlotDto } from './dto/create-doctor-appointment.dto';
import { UpdateDoctorAppoinmentSlotDto } from './dto/update-doctor-appointment.dto';

@Injectable()
export class AppointmentSlotService {
  constructor(
    @InjectRepository(AppointmentSlot)
    private appointment_slot_repo: Repository<AppointmentSlot>,
  ) {}

  async create(dto: CreateDoctorAppoinmentSlotDto): Promise<AppointmentSlot> {
    const slot = this.appointment_slot_repo.create(dto);
    return this.appointment_slot_repo.save(slot);
  }

  async findAll(): Promise<AppointmentSlot[]> {
    return this.appointment_slot_repo.find({ relations: ['doctor'] });
  }

  async findByDoctor(doctor_id: string): Promise<AppointmentSlot[]> {
    return this.appointment_slot_repo.find({ where: { doctor_id } });
  }

  async findOne(id: string): Promise<AppointmentSlot> {
    const slot = await this.appointment_slot_repo .findOne({ where: { id }, relations: ['doctor'] });
    if (!slot) throw new NotFoundException(`AppointmentSlot with id ${id} not found`);
    return slot;
  }

  async update(id: string, dto: UpdateDoctorAppoinmentSlotDto): Promise<AppointmentSlot> {
    await this.findOne(id);
    await this.appointment_slot_repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.appointment_slot_repo.delete(id);
  }
}
