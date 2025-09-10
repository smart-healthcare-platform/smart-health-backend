import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorBlockTime } from './doctor-block-time.entity';
import { CreateDoctorBlockTimeDto } from './dto/create-doctor-block-time.dto';
import { UpdateDoctorBlockTimeDto } from './dto/update-doctor-block-time.dto';

@Injectable()
export class DoctorBlockTimeService {
  constructor(
    @InjectRepository(DoctorBlockTime)
    private scheduleRepo: Repository<DoctorBlockTime>,
  ) {}

  async create(dto: CreateDoctorBlockTimeDto): Promise<DoctorBlockTime> {
    const schedule = this.scheduleRepo.create(dto);
    return this.scheduleRepo.save(schedule);
  }

  async findAll(): Promise<DoctorBlockTime[]> {
    return this.scheduleRepo.find({ relations: ['doctor'] });
  }

  async findByDoctor(doctor_id: string): Promise<DoctorBlockTime[]> {
    return this.scheduleRepo.find({ where: { doctor_id } });
  }

  async findOne(id: string): Promise<DoctorBlockTime> {
    const schedule = await this.scheduleRepo.findOne({ where: { id }, relations: ['doctor'] });
    if (!schedule) throw new NotFoundException(`DoctorSchedule with id ${id} not found`);
    return schedule;
  }

  async update(id: string, dto: UpdateDoctorBlockTimeDto): Promise<DoctorBlockTime> {
    await this.findOne(id);
    await this.scheduleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.scheduleRepo.delete(id);
  }
}
