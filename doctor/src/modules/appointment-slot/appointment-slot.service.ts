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
  async isSlotAvailable(doctorId: string, slotId: string): Promise<boolean> {
    const slot = await this.appointment_slot_repo.findOne({
      where: { id: slotId, doctor_id: doctorId },
    });

    if (!slot) {
      throw new NotFoundException(
        `Slot ${slotId} của doctor ${doctorId} không tồn tại`,
      );
    }

    return slot.status === 'available';
  }

  async bookSlot(doctorId: string, slotId: string, patientId?: string): Promise<AppointmentSlot> {
    const slot = await this.appointment_slot_repo.findOne({
      where: { id: slotId, doctor_id: doctorId },
    });

    if (!slot) {
      throw new NotFoundException(
        `Slot ${slotId} của doctor ${doctorId} không tồn tại`,
      );
    }

    if (slot.status !== 'available') {
      throw new Error(`Slot ${slotId} không khả dụng, trạng thái: ${slot.status}`);
    }

    slot.status = 'booked';
    if (patientId) {
      slot.patient_id = patientId;
    }

    return this.appointment_slot_repo.save(slot);
  }

  async cancelSlot(doctorId: string, slotId: string): Promise<AppointmentSlot> {
    const slot = await this.appointment_slot_repo.findOne({
      where: { id: slotId, doctor_id: doctorId },
    });

    if (!slot) {
      throw new NotFoundException(
        `Slot ${slotId} của doctor ${doctorId} không tồn tại`,
      );
    }

    slot.status = 'cancelled';
    return this.appointment_slot_repo.save(slot);
  }

}
