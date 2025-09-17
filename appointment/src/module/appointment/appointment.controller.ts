import { Controller, Get, Post, Body, Param, Patch, Delete, UseInterceptors } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments')
@UseInterceptors(ResponseInterceptor) 
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    // Trả về dữ liệu gốc, interceptor sẽ wrap
    return await this.appointmentsService.create(dto);
  }

  @Get()
  async findAll(): Promise<Appointment[]> {
    return await this.appointmentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Appointment> {
    return await this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.appointmentsService.remove(id);
  }
}
