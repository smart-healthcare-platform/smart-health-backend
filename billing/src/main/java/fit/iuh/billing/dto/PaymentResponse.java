package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private String paymentCode;
    
    // New fields
    private PaymentType paymentType;
    private String referenceId;
    private String appointmentId; // For grouping payments by appointment
    
    // Deprecated field - giữ lại để tương thích
    @Deprecated
    private String prescriptionId;
    
    private BigDecimal amount;
    private PaymentStatus status;
    private PaymentMethodType paymentMethod;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}