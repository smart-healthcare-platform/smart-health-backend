import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors } from '@nestjs/common';
import { DoctorCertificateService } from './doctor-certificates.service';
import { CreateDoctorCertificateDto } from './dto/create-doctor-certificates.dto';
import { UpdateDoctorLicenseDto } from './dto/update-doctor-certificates.dto';
import { DoctorCertificate } from './doctor-certificates.entity';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
@UseInterceptors(ResponseInterceptor)
@Controller('api/doctors/certificates')
export class DoctorCertificateController {
  constructor(private readonly certificateService: DoctorCertificateService) { }

  @Post()
  async create(@Body() dto: CreateDoctorCertificateDto): Promise<DoctorCertificate> {
    return this.certificateService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorCertificate[]> {
    return this.certificateService.findAll();
  }


  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorLicenseDto): Promise<DoctorCertificate> {
    return this.certificateService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.certificateService.remove(id);
  }
}
