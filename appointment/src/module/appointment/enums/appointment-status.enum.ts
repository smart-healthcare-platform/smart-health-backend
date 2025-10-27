/**
 * Enum trạng thái của appointment trong luồng khám bệnh
 */
export enum AppointmentStatus {
  /**
   * Đã đặt lịch, chờ xác nhận/thanh toán
   */
  PENDING = 'pending',

  /**
   * Đã xác nhận (sau khi thanh toán hoặc được phê duyệt)
   */
  CONFIRMED = 'confirmed',

  /**
   * Đã check-in tại quầy lễ tân, đang chờ khám
   */
  CHECKED_IN = 'checked_in',

  /**
   * Đang trong quá trình khám bệnh (bác sĩ đã gọi vào)
   */
  IN_PROGRESS = 'in_progress',

  /**
   * Đã hoàn thành khám bệnh
   */
  COMPLETED = 'completed',

  /**
   * Đã hủy lịch khám
   */
  CANCELLED = 'cancelled',

  /**
   * Không đến khám (đã đặt lịch nhưng không check-in)
   */
  NO_SHOW = 'no_show',
}
