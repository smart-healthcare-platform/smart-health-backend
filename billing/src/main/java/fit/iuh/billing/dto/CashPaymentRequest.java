package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO để tạo thanh toán tiền mặt tại quầy (dành cho Receptionist)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashPaymentRequest {
    
    /**
     * ID tham chiếu (VD: appointmentId cho APPOINTMENT_FEE, labTestOrderId cho LAB_TEST)
     */
    @NotNull(message = "Reference ID is required")
    private String referenceId;
    
    /**
     * Appointment ID for grouping payments
     * Optional - if not provided, will be set from referenceId for APPOINTMENT_FEE
     */
    private String appointmentId;
    
    /**
     * Số tiền thanh toán (VNĐ)
     */
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;
    
    /**
     * Loại thanh toán
     */
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;
    
    /**
     * Ghi chú (optional)
     */
    private String notes;
}
