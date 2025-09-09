import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorBlockTime } from './doctor-block-time.entity';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

@Injectable()
export class DoctorBlockTimeService {
  constructor(
    @InjectRepository(DoctorBlockTime)
    private scheduleRepo: Repository<DoctorBlockTime>,
  ) {}

  async create(dto: CreateDoctorScheduleDto): Promise<DoctorBlockTime> {
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

  async update(id: string, dto: UpdateDoctorScheduleDto): Promise<DoctorBlockTime> {
    await this.findOne(id);
    await this.scheduleRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.scheduleRepo.delete(id);
  }
}
