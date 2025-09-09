import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSlot } from './appointment-slot.entity';
import { CreateDoctorLicenseDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';

@Injectable()
export class AppointmentSlotService {
  constructor(
    @InjectRepository(AppointmentSlot)
    private licenseRepo: Repository<AppointmentSlot>,
  ) {}

  async create(dto: CreateDoctorLicenseDto): Promise<AppointmentSlot> {
    const license = this.licenseRepo.create(dto);
    return this.licenseRepo.save(license);
  }

  async findAll(): Promise<AppointmentSlot[]> {
    return this.licenseRepo.find({ relations: ['doctor'] });
  }

  async findByDoctor(doctor_id: string): Promise<AppointmentSlot[]> {
    return this.licenseRepo.find({ where: { doctor_id } });
  }

  async findOne(id: string): Promise<AppointmentSlot> {
    const license = await this.licenseRepo.findOne({ where: { id }, relations: ['doctor'] });
    if (!license) throw new NotFoundException(`DoctorLicense with id ${id} not found`);
    return license;
  }

  async update(id: string, dto: UpdateDoctorLicenseDto): Promise<AppointmentSlot> {
    await this.findOne(id);
    await this.licenseRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.licenseRepo.delete(id);
  }
}
