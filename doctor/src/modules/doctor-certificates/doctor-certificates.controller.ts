import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DoctorCertificateService } from './doctor-certificates.service';
import { CreateDoctorLicenseDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';
import { DoctorCertificate } from './doctor-certificates.entity';

@Controller('doctor-licenses')
export class DoctorCertificateController {
  constructor(private readonly licenseService: DoctorCertificateService) {}

  @Post()
  async create(@Body() dto: CreateDoctorLicenseDto): Promise<DoctorCertificate> {
    return this.licenseService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorCertificate[]> {
    return this.licenseService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<DoctorCertificate[]> {
    return this.licenseService.findByDoctor(doctorId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorLicenseDto): Promise<DoctorCertificate> {
    return this.licenseService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.licenseService.remove(id);
  }
}
