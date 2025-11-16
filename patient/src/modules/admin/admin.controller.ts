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
import { PatientStatsDto } from './dto/patient-stats.dto';
import { PatientGrowthDto } from './dto/patient-growth.dto';
import { PatientDemographicsDto } from './dto/patient-demographics.dto';
import { RecentPatientsDto } from './dto/recent-patients.dto';

/**
 * Admin Controller
 * Handles admin endpoints for patient analytics and statistics
 * Protected by InternalGuard - only accessible from API Gateway
 */
@Controller('v1/admin/patients')
@UseGuards(InternalGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /v1/admin/patients/stats
   * Returns overall patient statistics for admin dashboard
   */
  @Get('stats')
  async getPatientStats(): Promise<PatientStatsDto> {
    this.logger.log('Admin request: Get patient stats');
    return this.adminService.getPatientStats();
  }

  /**
   * GET /v1/admin/patients/growth
   * Returns patient growth trends over time
   * @param period - 'daily', 'weekly', or 'monthly' (default: 'daily')
   * @param days - Number of days to look back (default: 30)
   */
  @Get('growth')
  async getPatientGrowth(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number = 30,
  ): Promise<PatientGrowthDto> {
    this.logger.log(
      `Admin request: Get patient growth - period: ${period}, days: ${days}`,
    );
    return this.adminService.getPatientGrowth(period, days);
  }

  /**
   * GET /v1/admin/patients/demographics
   * Returns patient demographics breakdown (age groups, gender distribution)
   */
  @Get('demographics')
  async getPatientDemographics(): Promise<PatientDemographicsDto> {
    this.logger.log('Admin request: Get patient demographics');
    return this.adminService.getPatientDemographics();
  }

  /**
   * GET /v1/admin/patients/recent
   * Returns paginated list of recently registered patients
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   */
  @Get('recent')
  async getRecentPatients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<RecentPatientsDto> {
    // Limit max items per page to 100
    const maxLimit = Math.min(limit, 100);
    
    this.logger.log(
      `Admin request: Get recent patients - page: ${page}, limit: ${maxLimit}`,
    );
    return this.adminService.getRecentPatients(page, maxLimit);
  }

  /**
   * GET /v1/admin/patients/health
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