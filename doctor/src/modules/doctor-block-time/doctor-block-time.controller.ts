import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DoctorBlockTimeService } from './doctor-block-time.service';
import { DoctorBlockTime } from './doctor-block-time.entity';
import { CreateDoctorBlockTimeDto } from './dto/create-doctor-block-time.dto';

@Controller('doctor-block-time')
export class DoctorBlockTimeController {
  constructor(private readonly scheduleService: DoctorBlockTimeService) {}

  @Post()
  async create(@Body() dto: CreateDoctorBlockTimeDto): Promise<DoctorBlockTime> {
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
