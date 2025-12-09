package fit.iuh.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO cho composite payment
 * Trả về thông tin về payment tổng hợp và breakdown của các khoản phí
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompositePaymentResponse {

    /**
     * ID của composite payment
     */
    private Long paymentId;

    /**
     * Mã thanh toán
     */
    private String paymentCode;

    /**
     * URL thanh toán để bệnh nhân truy cập
     * Có thể là link redirect hoặc QR code URL
     */
    private String paymentUrl;

    /**
     * Tổng số tiền cần thanh toán
     */
    private BigDecimal totalAmount;

    /**
     * Phương thức thanh toán
     */
    private String paymentMethod;

    /**
     * Chi tiết breakdown các khoản phí
     */
    private List<PaymentBreakdownItem> breakdown;

    /**
     * Thời gian hết hạn của payment URL
     */
    private String expiredAt;

    /**
     * Item trong breakdown - thông tin chi tiết từng khoản phí
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentBreakdownItem {
        /**
         * ID của payment con
         */
        private Long paymentId;

        /**
         * Mã thanh toán con
         */
        private String paymentCode;

        /**
         * Loại thanh toán (APPOINTMENT_FEE, LAB_TEST, etc.)
         */
        private String paymentType;

        /**
         * Reference ID (appointmentId hoặc labTestOrderId)
         */
        private String referenceId;

        /**
         * Số tiền
         */
        private BigDecimal amount;

        /**
         * Mô tả
         */
        private String description;
    }
}