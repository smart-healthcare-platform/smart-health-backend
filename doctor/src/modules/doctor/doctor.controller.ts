
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './doctor.entity';
import { DoctorListDto } from './dto/list-doctor.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { UpsertDoctorWeeklyAvailabilityDto } from '../doctor-schedule/dto/create-doctor-weekly-availability.dto';

@Controller('api/doctors')
@UseInterceptors(ResponseInterceptor)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Post()
  async create(@Body() dto: CreateDoctorDto): Promise<Doctor> {
    return this.doctorService.create(dto);
  }

  @Get('stats')
  async getStats() {
    return this.doctorService.getDoctorStats();
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 6,
    @Query('search') search = '',
  ) {
    return this.doctorService.findAllBasic(Number(page), Number(limit), search);
  }

  @Get('by-user/:userId')
  async getByUserId(@Param('userId') userId: string): Promise<Doctor> {
    return this.doctorService.findByUserId(userId);
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

  @Post(':id/weekly')
  async upsertWeekly(
    @Param('id') id: string,
    @Body() dto: UpsertDoctorWeeklyAvailabilityDto,
  ) {
    return this.doctorService.upsertWeeklyAvailability(id, dto);
  }

  @Get(':doctorId/weekly')
  async getDoctorWeeklySchedule(@Param('doctorId') doctorId: string) {
    return this.doctorService.getWeeklyAvailabilities(doctorId);
  }
}

