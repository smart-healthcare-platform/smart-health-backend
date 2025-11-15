import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { DoctorStatsDto } from './dto/doctor-stats.dto';
import {
  TopDoctorsResponseDto,
  DepartmentPerformanceResponseDto,
} from './dto/top-doctors.dto';
import { InternalGuard } from './guards/internal.guard';

/**
 * Internal Guard - Only allows requests from API Gateway
 * Check for X-Internal-Request header and X-Gateway-Secret
 */
@Controller('v1/admin/doctors')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /v1/admin/doctors/stats
   * Returns overall doctor statistics
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getDoctorStats(): Promise<{
    success: boolean;
    data: DoctorStatsDto;
    meta: { requestId: string; responseTime: number; timestamp: string };
  }> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[${requestId}] Fetching doctor statistics`);

    try {
      const data = await this.adminService.getDoctorStats();
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${requestId}] Successfully fetched doctor stats in ${responseTime}ms`,
      );

      return {
        success: true,
        data,
        meta: {
          requestId,
          responseTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] Error fetching doctor stats (${responseTime}ms)`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /v1/admin/doctors/top
   * Returns top doctors by rating, appointments, and revenue
   */
  @Get('top')
  @HttpCode(HttpStatus.OK)
  async getTopDoctors(
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    data: TopDoctorsResponseDto;
    meta: { requestId: string; responseTime: number; timestamp: string };
  }> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    this.logger.log(`[${requestId}] Fetching top ${limitNum} doctors`);

    try {
      const data = await this.adminService.getTopDoctors(limitNum);
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${requestId}] Successfully fetched top doctors in ${responseTime}ms`,
      );

      return {
        success: true,
        data,
        meta: {
          requestId,
          responseTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] Error fetching top doctors (${responseTime}ms)`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /v1/admin/departments/performance
   * Returns performance metrics by specialty/department
   */
  @Get('/departments/performance')
  @HttpCode(HttpStatus.OK)
  async getDepartmentPerformance(): Promise<{
    success: boolean;
    data: DepartmentPerformanceResponseDto;
    meta: { requestId: string; responseTime: number; timestamp: string };
  }> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[${requestId}] Fetching department performance metrics`);

    try {
      const data = await this.adminService.getDepartmentPerformance();
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${requestId}] Successfully fetched department performance in ${responseTime}ms`,
      );

      return {
        success: true,
        data,
        meta: {
          requestId,
          responseTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] Error fetching department performance (${responseTime}ms)`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * GET /v1/admin/doctors/health
   * Health check endpoint
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): {
    status: string;
    timestamp: string;
    service: string;
  } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'doctor-admin',
    };
  }
}