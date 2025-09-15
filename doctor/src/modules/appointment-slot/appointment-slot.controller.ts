import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AppointmentSlotService } from './appointment-slot.service';
import { CreateDoctorLicenseDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';
import { AppointmentSlot } from './appointment-slot.entity';

@Controller('appointment-slots')
export class AppointmentSlotController {
  constructor(private readonly licenseService: AppointmentSlotService) {}

  @Post()
  async create(@Body() dto: CreateDoctorLicenseDto): Promise<AppointmentSlot> {
    return this.licenseService.create(dto);
  }

  @Get()
  async findAll(): Promise<AppointmentSlot[]> {
    return this.licenseService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<AppointmentSlot[]> {
    return this.licenseService.findByDoctor(doctorId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorLicenseDto): Promise<AppointmentSlot> {
    return this.licenseService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.licenseService.remove(id);
  }
}
