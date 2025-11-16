/**
 * Status Distribution DTO
 * Returns breakdown of appointments by status, type, category, and payment status
 */

/**
 * Single status count
 */
export class StatusCount {
  /** Status name */
  status: string;

  /** Number of appointments with this status */
  count: number;

  /** Percentage of total */
  percentage: number;
}

/**
 * Type distribution (ONLINE/OFFLINE)
 */
export class TypeCount {
  /** Type name */
  type: string;

  /** Number of appointments with this type */
  count: number;

  /** Percentage of total */
  percentage: number;
}

/**
 * Category distribution (NEW/FOLLOW_UP)
 */
export class CategoryCount {
  /** Category name */
  category: string;

  /** Number of appointments with this category */
  count: number;

  /** Percentage of total */
  percentage: number;
}

/**
 * Payment status distribution
 */
export class PaymentStatusCount {
  /** Payment status */
  paymentStatus: string;

  /** Number of appointments with this payment status */
  count: number;

  /** Percentage of total */
  percentage: number;

  /** Total revenue for this payment status */
  revenue: number;
}

/**
 * Status distribution response
 */
export class StatusDistributionDto {
  /** Distribution by appointment status */
  statusDistribution: StatusCount[];

  /** Distribution by appointment type */
  typeDistribution: TypeCount[];

  /** Distribution by appointment category */
  categoryDistribution: CategoryCount[];

  /** Distribution by payment status */
  paymentDistribution: PaymentStatusCount[];

  /** Total appointments */
  totalAppointments: number;

  /** Most common status */
  mostCommonStatus: string;

  /** Most common type */
  mostCommonType: string;

  /** Most common category */
  mostCommonCategory: string;

  /** Most common payment status */
  mostCommonPaymentStatus: string;
}