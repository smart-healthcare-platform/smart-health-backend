/**
 * Payment Status Enum for Appointment
 * Represents the payment state of an appointment
 */
export enum PaymentStatus {
  /**
   * Chưa thanh toán - Appointment mới tạo
   */
  UNPAID = 'UNPAID',

  /**
   * Đang chờ thanh toán - Đã tạo payment request, chờ bệnh nhân thanh toán
   */
  PENDING = 'PENDING',

  /**
   * Đã thanh toán thành công - Bệnh nhân đã thanh toán xong
   */
  PAID = 'PAID',

  /**
   * Đã hoàn tiền - Appointment bị hủy và đã hoàn tiền
   */
  REFUNDED = 'REFUNDED',
}
