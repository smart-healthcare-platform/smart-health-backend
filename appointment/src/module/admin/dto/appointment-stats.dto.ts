/**
 * Appointment Statistics DTO
 * Returns overall appointment statistics for admin dashboard
 */
export class AppointmentStatsDto {
  /** Total number of appointments */
  totalAppointments: number;

  /** Appointments with PENDING status */
  pendingAppointments: number;

  /** Appointments with CONFIRMED status */
  confirmedAppointments: number;

  /** Appointments with COMPLETED status */
  completedAppointments: number;

  /** Appointments with CANCELLED status */
  cancelledAppointments: number;

  /** New appointments created this month */
  newThisMonth: number;

  /** New appointments created this week */
  newThisWeek: number;

  /** Appointments scheduled for today */
  scheduledToday: number;

  /** Total revenue from paid appointments */
  totalRevenue: number;

  /** Revenue collected this month */
  revenueThisMonth: number;

  /** Average consultation fee */
  averageConsultationFee: number;

  /** Most common appointment type (ONLINE/OFFLINE) */
  mostCommonType: string;

  /** Most common appointment category (NEW/FOLLOW_UP) */
  mostCommonCategory: string;

  /** Average appointments per day (last 30 days) */
  averagePerDay: number;

  /** Completion rate percentage */
  completionRate: number;

  /** Cancellation rate percentage */
  cancellationRate: number;
}