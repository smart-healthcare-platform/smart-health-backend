import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AppointmentService } from '../appointment.service';
import { InternalApiGuard } from '../../../common/guards/internal-api.guard';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';

/**
 * Internal API Controller
 * Chỉ được gọi bởi các service nội bộ (Billing Service)
 * Yêu cầu header: X-Internal-Secret
 */
@Controller('api/v1/internal/appointments')
@UseGuards(InternalApiGuard)
export class InternalAppointmentController {
  private readonly logger = new Logger(InternalAppointmentController.name);

  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * Endpoint được gọi bởi Billing Service khi thanh toán thành công
   * POST /api/v1/internal/appointments/{appointmentId}/confirm-payment
   *
   * @param appointmentId - ID của appointment
   * @param paymentData - Thông tin thanh toán (paymentId, amount)
   */
  @Post(':appointmentId/confirm-payment')
  async confirmPayment(
    @Param('appointmentId') appointmentId: string,
    @Body() paymentData: ConfirmPaymentDto,
  ) {
    this.logger.log(
      `Received payment confirmation for appointment ${appointmentId}`,
    );
    this.logger.debug(`Payment data: ${JSON.stringify(paymentData)}`);

    await this.appointmentService.confirmPayment(appointmentId, paymentData);

    return {
      success: true,
      message: 'Payment confirmed successfully',
      appointmentId,
    };
  }
}
