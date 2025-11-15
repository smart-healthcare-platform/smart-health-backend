import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InternalGuard } from './guards/internal.guard';
import { AppointmentStatsDto } from './dto/appointment-stats.dto';
import { AppointmentTrendsDto } from './dto/appointment-trends.dto';
import { StatusDistributionDto } from './dto/status-distribution.dto';
import { RecentAppointmentsDto } from './dto/recent-appointments.dto';

/**
 * Admin Controller
 * Handles admin endpoints for appointment analytics and statistics
 * Protected by InternalGuard - only accessible from API Gateway
 */
@Controller('v1/admin/appointments')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /v1/admin/appointments/stats
   * Returns overall appointment statistics for admin dashboard
   */
  @Get('stats')
  async getAppointmentStats(): Promise<AppointmentStatsDto> {
    this.logger.log('Admin request: Get appointment stats');
    return this.adminService.getAppointmentStats();
  }

  /**
   * GET /v1/admin/appointments/trends
   * Returns appointment trends over time
   * @param period - 'daily', 'weekly', or 'monthly' (default: 'daily')
   * @param days - Number of days to look back (default: 30)
   */
  @Get('trends')
  async getAppointmentTrends(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
  ): Promise<AppointmentTrendsDto> {
    this.logger.log(
      `Admin request: Get appointment trends - period: ${period}, days: ${days}`,
    );
    return this.adminService.getAppointmentTrends(period, days);
  }

  /**
   * GET /v1/admin/appointments/status-distribution
   * Returns breakdown of appointments by status, type, category, and payment
   */
  @Get('status-distribution')
  async getStatusDistribution(): Promise<StatusDistributionDto> {
    this.logger.log('Admin request: Get status distribution');
    return this.adminService.getStatusDistribution();
  }

  /**
   * GET /v1/admin/appointments/recent
   * Returns paginated list of recently created appointments
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   */
  @Get('recent')
  async getRecentAppointments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<RecentAppointmentsDto> {
    // Limit max items per page to 100
    const maxLimit = Math.min(limit, 100);

    this.logger.log(
      `Admin request: Get recent appointments - page: ${page}, limit: ${maxLimit}`,
    );
    return this.adminService.getRecentAppointments(page, maxLimit);
  }

  /**
   * GET /v1/admin/appointments/health
   * Health check endpoint for admin service
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    this.logger.log('Admin request: Health check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}