import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './doctor.entity';
import { DoctorListDto } from './dto/list-doctor.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/doctors')
// @UseInterceptors(ResponseInterceptor) 
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Post()
  async create(@Body() dto: CreateDoctorDto): Promise<Doctor> {
    return this.doctorService.create(dto);
  }

  @Get()
  async findAll(): Promise<DoctorListDto[]> {
    return this.doctorService.findAllBasic();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto): Promise<Doctor> {
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.doctorService.remove(id);
  }
}
