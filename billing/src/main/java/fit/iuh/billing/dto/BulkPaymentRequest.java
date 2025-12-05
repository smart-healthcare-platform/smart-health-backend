package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO for bulk payment processing
 * Allows receptionist to pay multiple payments at once
 */
@Data
public class BulkPaymentRequest {
    /**
     * List of payment codes to process
     * Example: ["PAY-001", "PAY-002", "PAY-003"]
     */
    @NotEmpty(message = "Payment codes are required")
    private List<String> paymentCodes;

    /**
     * Payment method used for all payments
     * Typically CASH for receptionist counter payments
     */
    @NotNull(message = "Payment method is required")
    private PaymentMethodType paymentMethod;

    /**
     * Total amount being paid
     * Must match the sum of all payment amounts for validation
     */
    @NotNull(message = "Total amount is required")
    @Positive(message = "Total amount must be positive")
    private BigDecimal totalAmount;

    /**
     * Optional notes from receptionist
     * Example: "Thu tiền mặt tại quầy"
     */
    private String notes;
}
