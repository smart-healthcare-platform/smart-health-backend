package fit.iuh.billing.enums;

/**
 * Enum đại diện cho các trạng thái của một yêu cầu thanh toán.
 */
public enum PaymentStatus {
    /**
     * Thanh toán đang chờ xử lý, chưa được gửi đến cổng thanh toán.
     */
    PENDING,

    /**
     * Đã gửi yêu cầu đến cổng thanh toán và đang chờ kết quả.
     */
    PROCESSING,

    /**
     * Thanh toán đã được xác nhận thành công.
     */
    COMPLETED,

    /**
     * Thanh toán thất bại.
     */
    FAILED,

    /**
     * Thanh toán đã hết hạn.
     */
    EXPIRED,

    /**
     * Thanh toán đã bị hủy.
     */
    CANCELLED,

    /**
     * Thanh toán đã được hoàn tiền.
     */
    REFUNDED
}