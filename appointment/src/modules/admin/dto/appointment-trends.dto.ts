/**
 * Appointment Trends DTO
 * Returns time-based appointment trends for admin dashboard
 */

/**
 * Single data point in the trends chart
 */
export class TrendDataPoint {
  /** Date in YYYY-MM-DD format */
  date: string;

  /** Number of appointments on this date */
  count: number;

  /** Number of completed appointments */
  completed: number;

  /** Number of cancelled appointments */
  cancelled: number;

  /** Revenue generated on this date */
  revenue: number;
}

/**
 * Appointment trends response
 */
export class AppointmentTrendsDto {
  /** Time period: 'daily', 'weekly', or 'monthly' */
  period: 'daily' | 'weekly' | 'monthly';

  /** Array of trend data points */
  data: TrendDataPoint[];

  /** Total appointments in the period */
  totalAppointments: number;

  /** Total revenue in the period */
  totalRevenue: number;

  /** Average appointments per period */
  averagePerPeriod: number;

  /** Percentage change compared to previous period */
  percentageChange: number;

  /** Peak day (date with most appointments) */
  peakDay: string;

  /** Peak count (number of appointments on peak day) */
  peakCount: number;
}