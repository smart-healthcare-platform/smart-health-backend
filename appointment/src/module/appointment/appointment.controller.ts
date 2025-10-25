import { Controller, Get, Post, Body, Param, Patch, Delete, UseInterceptors, Query, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('api/appointments')
@UseInterceptors(ResponseInterceptor)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    return await this.appointmentsService.create(dto);
  }

  @Get()
  async findAll(): Promise<Appointment[]> {
    return await this.appointmentsService.findAll();
  }

  @Get('get-by-id/:id')
  async getAppointmentDetail(@Param('id') id: string) {
    return this.appointmentsService.getAppointmentDetail(id);
  }
  
  @Get('doctor/:doctorId')
  async getAppointmentsByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return await this.appointmentsService.getAppointmentsByDoctor(
      doctorId,
      start,
      end,
    );
  }

  @Get('patient/:patientId')
  async getAppointmentsByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 3,
    @Query('search') search?: string,
    @Query('status') status?: 'confirmed' | 'completed' | 'cancelled' | 'all',
    @Query('dateRange') dateRange?: 'today' | 'week' | 'month' | 'year' | 'all',
  ) {
    return await this.appointmentsService.getAppointmentsByPatient(
      patientId,
      +page,
      +limit,
      search,
      status,
      dateRange,
    );
  }


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentsService.update(id, dto);
  }

  /**
   * Tạo payment request cho appointment
   * POST /api/appointments/:id/create-payment
   */
  @Post(':id/create-payment')
  async createPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentRequestDto,
  ) {
    return await this.appointmentsService.createPaymentForAppointment(id, dto);
  }

  /**
   * Check-in appointment tại lễ tân
   * POST /api/appointments/:id/check-in
   */
  @Post(':id/check-in')
  async checkIn(
    @Param('id') id: string,
    @Body() dto?: CheckInDto,
  ) {
    return await this.appointmentsService.checkIn(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.appointmentsService.remove(id);
  }
}
