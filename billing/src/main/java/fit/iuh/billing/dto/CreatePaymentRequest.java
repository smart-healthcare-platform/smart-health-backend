package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO cho việc tạo payment request mới
 * Hỗ trợ nhiều loại thanh toán: Phí khám, Xét nghiệm, Đơn thuốc, etc.
 */
@Data
public class CreatePaymentRequest {
    
    /**
     * Loại thanh toán
     * - APPOINTMENT_FEE: Thanh toán phí khám bệnh
     * - LAB_TEST: Thanh toán xét nghiệm
     * - PRESCRIPTION: Thanh toán đơn thuốc (deprecated - hệ thống không bán thuốc)
     * - OTHER: Các khoản phí khác
     */
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;
    
    /**
     * ID tham chiếu tùy thuộc vào paymentType:
     * - Nếu paymentType = APPOINTMENT_FEE → appointmentId
     * - Nếu paymentType = LAB_TEST → labTestId
     * - Nếu paymentType = PRESCRIPTION → prescriptionId
     * - Nếu paymentType = OTHER → referenceId tương ứng
     */
    @NotNull(message = "Reference ID is required")
    private String referenceId;
    
    /**
     * Số tiền cần thanh toán
     */
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;
    
    /**
     * Phương thức thanh toán: MOMO, VNPAY, COD, etc.
     */
    @NotNull(message = "Payment method is required")
    private PaymentMethodType paymentMethod;
    
    // DEPRECATED: Giữ lại để tương thích với code cũ
    @Deprecated
    private String prescriptionId;
}