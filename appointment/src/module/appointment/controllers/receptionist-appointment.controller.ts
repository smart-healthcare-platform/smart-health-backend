import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AppointmentsService } from '../appointments.service';
import { UpdateAppointmentStatusDto } from '../dto/update-status.dto';

/**
 * Controller dành cho Receptionist (Lễ tân)
 * Các endpoints để quản lý check-in, xem danh sách appointments hôm nay
 */
@Controller('api/appointments/receptionist')
export class ReceptionistAppointmentController {
  private readonly logger = new Logger(ReceptionistAppointmentController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Lấy danh sách appointments hôm nay
   * GET /api/v1/appointments/receptionist/today
   * 
   * Query params:
   * - status: pending | confirmed | checked_in | in_progress | completed
   * - paymentStatus: UNPAID | PENDING | PAID | REFUNDED
   * - daysOffset: 0=hôm nay, 1=ngày mai, -1=hôm qua (for testing)
   */
  @Get('today')
  async getTodayAppointments(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('daysOffset') daysOffset?: number,
  ) {
    const offset = daysOffset ? parseInt(String(daysOffset)) : 0;
    this.logger.log(`Getting appointments - status: ${status}, paymentStatus: ${paymentStatus}, daysOffset: ${offset}`);
    
    return this.appointmentsService.getTodayAppointments({
      status,
      paymentStatus,
      daysOffset: offset,
    });
  }

  /**
   * Tìm kiếm appointment để check-in
   * GET /api/v1/appointments/receptionist/search?keyword=xxx
   * 
   * Tìm theo: ID appointment, tên bệnh nhân, số điện thoại
   */
  @Get('search')
  async searchAppointments(@Query('keyword') keyword: string) {
    this.logger.log(`Searching appointments with keyword: ${keyword}`);
    
    return this.appointmentsService.searchForReceptionist(keyword);
  }

  /**
   * Cập nhật status của appointment
   * POST /api/v1/appointments/receptionist/:id/update-status
   * 
   * Body: { status: 'checked_in' | 'in_progress' | 'completed', notes?: string }
   */
  @Post(':id/update-status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    this.logger.log(`Updating appointment ${id} status to ${dto.status}`);
    
    return this.appointmentsService.updateStatus(id, dto.status);
  }
}
