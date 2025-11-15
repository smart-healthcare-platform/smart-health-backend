/**
 * Recent Appointments DTO
 * Returns paginated list of recent appointments for admin dashboard
 */

/**
 * Single recent appointment item
 */
export class RecentAppointmentItem {
  /** Appointment ID */
  id: string;

  /** Doctor ID */
  doctorId: string;

  /** Doctor name */
  doctorName: string;

  /** Patient ID */
  patientId: string;

  /** Patient name */
  patientName: string;

  /** Appointment status */
  status: string;

  /** Appointment type (ONLINE/OFFLINE) */
  type: string;

  /** Appointment category (NEW/FOLLOW_UP) */
  category: string;

  /** Scheduled start time */
  startAt: Date;

  /** Scheduled end time */
  endAt: Date | null;

  /** Payment status */
  paymentStatus: string;

  /** Amount paid */
  paidAmount: number | null;

  /** Consultation fee */
  consultationFee: number;

  /** Appointment notes */
  notes: string | null;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Recent appointments response with pagination
 */
export class RecentAppointmentsDto {
  /** Array of recent appointment items */
  appointments: RecentAppointmentItem[];

  /** Total number of appointments */
  total: number;

  /** Current page number */
  page: number;

  /** Items per page */
  limit: number;

  /** Total number of pages */
  totalPages: number;
}