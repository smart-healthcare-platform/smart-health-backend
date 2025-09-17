import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-vailability.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-vailability.dto';
import { DoctorAvailability } from './doctor-availability.entity';

@Controller('doctor-degrees')
export class DoctorAvailabilityController {
  constructor(private readonly degreeService: DoctorAvailabilityService) {}

  @Post()
  async create(@Body() dto: CreateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    return this.degreeService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorAvailability[]> {
    return this.degreeService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<DoctorAvailability[]> {
    return this.degreeService.findByDoctor(doctorId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorAvailabilityDto): Promise<DoctorAvailability> {
    return this.degreeService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.degreeService.remove(id);
  }
}
