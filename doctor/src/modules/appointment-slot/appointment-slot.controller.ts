import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors } from '@nestjs/common';
import { AppointmentSlotService } from './appointment-slot.service';
import { CreateDoctorAppoinmentSlotDto } from './dto/create-doctor-appointment.dto';
import { UpdateDoctorAppoinmentSlotDto } from './dto/update-doctor-appointment.dto';
import { AppointmentSlot } from './appointment-slot.entity';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/doctors/appointment-slots')
@UseInterceptors(ResponseInterceptor) 
export class AppointmentSlotController {
  constructor(private readonly appointment_slot: AppointmentSlotService) {}

  @Post()
  async create(@Body() dto: CreateDoctorAppoinmentSlotDto): Promise<AppointmentSlot> {
    return this.appointment_slot.create(dto);
  }

  @Get()
  async findAll(): Promise<AppointmentSlot[]> {
    return this.appointment_slot.findAll();
  }

  @Get('/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string): Promise<AppointmentSlot[]> {
    return this.appointment_slot.findByDoctor(doctorId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorAppoinmentSlotDto): Promise<AppointmentSlot> {
    return this.appointment_slot.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.appointment_slot.remove(id);
  }
}
