import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../module/appointment/appointment.entity';
import { AppointmentStatus } from '../../module/appointment/enums/appointment-status.enum';
import { AppointmentType } from '../../module/appointment/enums/appointment-type.enum';
import { AppointmentCategory } from '../../module/appointment/enums/appointment-category.enum';
import { PaymentStatus } from '../../module/appointment/enums/payment-status.enum';
import { AppointmentStatsDto } from './dto/appointment-stats.dto';
import {
  AppointmentTrendsDto,
  TrendDataPoint,
} from './dto/appointment-trends.dto';
import {
  StatusDistributionDto,
  StatusCount,
  TypeCount,
  CategoryCount,
  PaymentStatusCount,
} from './dto/status-distribution.dto';
import {
  RecentAppointmentsDto,
  RecentAppointmentItem,
} from './dto/recent-appointments.dto';

/**
 * Admin Service
 * Handles all admin-related operations for appointment analytics and statistics
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Get overall appointment statistics
   * Returns key metrics for admin dashboard
   */
  async getAppointmentStats(): Promise<AppointmentStatsDto> {
    try {
      this.logger.log('Fetching appointment statistics');

      // Get total appointments
      const totalAppointments = await this.appointmentRepository.count();

      // Get counts by status
      const pendingAppointments = await this.appointmentRepository.count({
        where: { status: AppointmentStatus.PENDING },
      });

      const confirmedAppointments = await this.appointmentRepository.count({
        where: { status: AppointmentStatus.CONFIRMED },
      });

      const completedAppointments = await this.appointmentRepository.count({
        where: { status: AppointmentStatus.COMPLETED },
      });

      const cancelledAppointments = await this.appointmentRepository.count({
        where: { status: AppointmentStatus.CANCELLED },
      });

      // Get new appointments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newThisMonth = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.createdAt >= :date', { date: startOfMonth })
        .getCount();

      // Get new appointments this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const newThisWeek = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.createdAt >= :date', { date: startOfWeek })
        .getCount();

      // Get appointments scheduled for today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const scheduledToday = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.startAt >= :start', { start: startOfToday })
        .andWhere('appointment.startAt <= :end', { end: endOfToday })
        .getCount();

      // Calculate revenue
      const revenueQuery = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('SUM(appointment.paidAmount)', 'total')
        .where('appointment.paymentStatus = :status', {
          status: PaymentStatus.PAID,
        })
        .getRawOne();

      const totalRevenue = parseFloat(revenueQuery?.total || '0');

      const revenueThisMonthQuery = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('SUM(appointment.paidAmount)', 'total')
        .where('appointment.paymentStatus = :status', {
          status: PaymentStatus.PAID,
        })
        .andWhere('appointment.paidAt >= :date', { date: startOfMonth })
        .getRawOne();

      const revenueThisMonth = parseFloat(
        revenueThisMonthQuery?.total || '0',
      );

      // Calculate average consultation fee
      const avgFeeQuery = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('AVG(appointment.consultationFee)', 'avg')
        .getRawOne();

      const averageConsultationFee = Math.round(
        parseFloat(avgFeeQuery?.avg || '0'),
      );

      // Get most common type
      const typeStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.type')
        .orderBy('count', 'DESC')
        .getRawOne();

      const mostCommonType = typeStats?.type || 'N/A';

      // Get most common category
      const categoryStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.category')
        .orderBy('count', 'DESC')
        .getRawOne();

      const mostCommonCategory = categoryStats?.category || 'N/A';

      // Calculate average per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const appointmentsLast30Days = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount();

      const averagePerDay = Math.round((appointmentsLast30Days / 30) * 10) / 10;

      // Calculate completion and cancellation rates
      const completionRate =
        totalAppointments > 0
          ? Math.round((completedAppointments / totalAppointments) * 10000) /
            100
          : 0;

      const cancellationRate =
        totalAppointments > 0
          ? Math.round((cancelledAppointments / totalAppointments) * 10000) /
            100
          : 0;

      return {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        newThisMonth,
        newThisWeek,
        scheduledToday,
        totalRevenue,
        revenueThisMonth,
        averageConsultationFee,
        mostCommonType,
        mostCommonCategory,
        averagePerDay,
        completionRate,
        cancellationRate,
      };
    } catch (error) {
      this.logger.error('Error fetching appointment stats', error);
      throw error;
    }
  }

  /**
   * Get appointment trends over time
   * @param period - 'daily', 'weekly', or 'monthly'
   * @param days - Number of days to look back (default: 30)
   */
  async getAppointmentTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30,
  ): Promise<AppointmentTrendsDto> {
    try {
      this.logger.log(`Fetching appointment trends for period: ${period}`);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Get appointments grouped by date
      const appointments = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('DATE(appointment.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .addSelect(
          'SUM(CASE WHEN appointment.status = :completed THEN 1 ELSE 0 END)',
          'completed',
        )
        .addSelect(
          'SUM(CASE WHEN appointment.status = :cancelled THEN 1 ELSE 0 END)',
          'cancelled',
        )
        .addSelect(
          'SUM(CASE WHEN appointment.paymentStatus = :paid THEN appointment.paidAmount ELSE 0 END)',
          'revenue',
        )
        .where('appointment.createdAt >= :startDate', { startDate })
        .groupBy('DATE(appointment.createdAt)')
        .orderBy('DATE(appointment.createdAt)', 'ASC')
        .setParameters({
          completed: AppointmentStatus.COMPLETED,
          cancelled: AppointmentStatus.CANCELLED,
          paid: PaymentStatus.PAID,
        })
        .getRawMany();

      // Build data points with filled dates
      const dataPoints: TrendDataPoint[] = [];
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const appointmentMap = new Map(
        appointments.map((a) => [
          a.date,
          {
            count: parseInt(a.count, 10),
            completed: parseInt(a.completed, 10),
            cancelled: parseInt(a.cancelled, 10),
            revenue: parseFloat(a.revenue || '0'),
          },
        ]),
      );

      let totalAppointments = 0;
      let totalRevenue = 0;
      let peakCount = 0;
      let peakDay = '';

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const data = appointmentMap.get(dateStr) || {
          count: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
        };

        dataPoints.push({
          date: dateStr,
          count: data.count,
          completed: data.completed,
          cancelled: data.cancelled,
          revenue: data.revenue,
        });

        totalAppointments += data.count;
        totalRevenue += data.revenue;

        if (data.count > peakCount) {
          peakCount = data.count;
          peakDay = dateStr;
        }

        // Increment date based on period
        if (period === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (period === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Calculate average per period
      const averagePerPeriod =
        dataPoints.length > 0
          ? Math.round((totalAppointments / dataPoints.length) * 10) / 10
          : 0;

      // Calculate percentage change (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      const previousCount = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.createdAt >= :startDate', {
          startDate: previousStartDate,
        })
        .andWhere('appointment.createdAt < :endDate', { endDate: startDate })
        .getCount();

      const percentageChange =
        previousCount > 0
          ? Math.round(
              ((totalAppointments - previousCount) / previousCount) * 10000,
            ) / 100
          : totalAppointments > 0
            ? 100
            : 0;

      return {
        period,
        data: dataPoints,
        totalAppointments,
        totalRevenue,
        averagePerPeriod,
        percentageChange,
        peakDay: peakDay || 'N/A',
        peakCount,
      };
    } catch (error) {
      this.logger.error('Error fetching appointment trends', error);
      throw error;
    }
  }

  /**
   * Get status distribution
   * Returns breakdown by status, type, category, and payment status
   */
  async getStatusDistribution(): Promise<StatusDistributionDto> {
    try {
      this.logger.log('Fetching status distribution');

      const totalAppointments = await this.appointmentRepository.count();

      // Get status distribution
      const statusStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.status')
        .getRawMany();

      const statusDistribution: StatusCount[] = statusStats.map((stat) => ({
        status: stat.status,
        count: parseInt(stat.count, 10),
        percentage:
          totalAppointments > 0
            ? Math.round((parseInt(stat.count, 10) / totalAppointments) * 10000) /
              100
            : 0,
      }));

      // Get type distribution
      const typeStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.type')
        .getRawMany();

      const typeDistribution: TypeCount[] = typeStats.map((stat) => ({
        type: stat.type,
        count: parseInt(stat.count, 10),
        percentage:
          totalAppointments > 0
            ? Math.round((parseInt(stat.count, 10) / totalAppointments) * 10000) /
              100
            : 0,
      }));

      // Get category distribution
      const categoryStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .groupBy('appointment.category')
        .getRawMany();

      const categoryDistribution: CategoryCount[] = categoryStats.map(
        (stat) => ({
          category: stat.category,
          count: parseInt(stat.count, 10),
          percentage:
            totalAppointments > 0
              ? Math.round(
                  (parseInt(stat.count, 10) / totalAppointments) * 10000,
                ) / 100
              : 0,
        }),
      );

      // Get payment distribution
      const paymentStats = await this.appointmentRepository
        .createQueryBuilder('appointment')
        .select('appointment.paymentStatus', 'paymentStatus')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(appointment.paidAmount)', 'revenue')
        .groupBy('appointment.paymentStatus')
        .getRawMany();

      const paymentDistribution: PaymentStatusCount[] = paymentStats.map(
        (stat) => ({
          paymentStatus: stat.paymentStatus,
          count: parseInt(stat.count, 10),
          percentage:
            totalAppointments > 0
              ? Math.round(
                  (parseInt(stat.count, 10) / totalAppointments) * 10000,
                ) / 100
              : 0,
          revenue: parseFloat(stat.revenue || '0'),
        }),
      );

      // Find most common values
      const mostCommonStatus =
        statusDistribution.length > 0
          ? statusDistribution.reduce((prev, current) =>
              prev.count > current.count ? prev : current,
            ).status
          : 'N/A';

      const mostCommonType =
        typeDistribution.length > 0
          ? typeDistribution.reduce((prev, current) =>
              prev.count > current.count ? prev : current,
            ).type
          : 'N/A';

      const mostCommonCategory =
        categoryDistribution.length > 0
          ? categoryDistribution.reduce((prev, current) =>
              prev.count > current.count ? prev : current,
            ).category
          : 'N/A';

      const mostCommonPaymentStatus =
        paymentDistribution.length > 0
          ? paymentDistribution.reduce((prev, current) =>
              prev.count > current.count ? prev : current,
            ).paymentStatus
          : 'N/A';

      return {
        statusDistribution,
        typeDistribution,
        categoryDistribution,
        paymentDistribution,
        totalAppointments,
        mostCommonStatus,
        mostCommonType,
        mostCommonCategory,
        mostCommonPaymentStatus,
      };
    } catch (error) {
      this.logger.error('Error fetching status distribution', error);
      throw error;
    }
  }

  /**
   * Get recent appointments
   * Returns paginated list of recently created appointments
   */
  async getRecentAppointments(
    page: number = 1,
    limit: number = 10,
  ): Promise<RecentAppointmentsDto> {
    try {
      this.logger.log(
        `Fetching recent appointments - page: ${page}, limit: ${limit}`,
      );

      const skip = (page - 1) * limit;

      const [appointments, total] = await this.appointmentRepository.findAndCount({
        order: { createdAt: 'DESC' },
        take: limit,
        skip,
      });

      const appointmentItems: RecentAppointmentItem[] = appointments.map(
        (appointment) => ({
          id: appointment.id,
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          status: appointment.status,
          type: appointment.type,
          category: appointment.category,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          paymentStatus: appointment.paymentStatus,
          paidAmount: appointment.paidAmount,
          consultationFee: appointment.consultationFee,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        }),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        appointments: appointmentItems,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching recent appointments', error);
      throw error;
    }
  }
}