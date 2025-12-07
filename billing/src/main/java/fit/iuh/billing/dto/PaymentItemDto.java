package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO representing a single payment item
 * Used in outstanding payments response and payment history
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentItemDto {
    /**
     * Unique payment code (e.g., "PAY-12345")
     */
    private String paymentCode;

    /**
     * Type of payment: APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION, OTHER
     */
    private PaymentType paymentType;

    /**
     * Payment amount in VND
     */
    private BigDecimal amount;

    /**
     * Current payment status
     */
    private PaymentStatus status;

    /**
     * Human-readable description
     * Examples: "Phí khám bệnh", "Xét nghiệm máu tổng quát"
     */
    private String description;

    /**
     * When the payment was created
     */
    private LocalDateTime createdAt;

    /**
     * When the payment was completed (null if not paid yet)
     */
    private LocalDateTime paidAt;
}
