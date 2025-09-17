import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorAvailability } from './doctor-availability.entity';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-vailability.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-vailability.dto';

@Injectable()
export class DoctorAvailabilityService {
  constructor(
    @InjectRepository(DoctorAvailability)
    private degreeRepo: Repository<DoctorAvailability>,
  ) {}

  async create(dto: CreateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    const degree = this.degreeRepo.create(dto);
    return this.degreeRepo.save(degree);
  }

  async findAll(): Promise<DoctorAvailability[]> {
    return this.degreeRepo.find({ relations: ['doctor'] });
  }

  async findByDoctor(doctor_id: string): Promise<DoctorAvailability[]> {
    return this.degreeRepo.find({ where: { doctor_id } });
  }

  async findOne(id: string): Promise<DoctorAvailability> {
    const degree = await this.degreeRepo.findOne({ where: { id }, relations: ['doctor'] });
    if (!degree) throw new NotFoundException(`DoctorDegree with id ${id} not found`);
    return degree;
  }

  async update(id: string, dto: UpdateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    await this.findOne(id);
    await this.degreeRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.degreeRepo.delete(id);
  }
}
