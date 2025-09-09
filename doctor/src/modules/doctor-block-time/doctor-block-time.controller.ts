import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DoctorBlockTimeService } from './doctor-block-time.service';
import { DoctorBlockTime } from './doctor-block-time.entity';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';

@Controller('doctor-block-time')
export class DoctorBlockTimeController {
  constructor(private readonly scheduleService: DoctorBlockTimeService) {}

  @Post()
  async create(@Body() dto: CreateDoctorScheduleDto): Promise<DoctorBlockTime> {
    return this.scheduleService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorBlockTime[]> {
    return this.scheduleService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<DoctorBlockTime[]> {
    return this.scheduleService.findByDoctor(doctorId);
  }
}
