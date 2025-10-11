package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
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
    private String prescriptionId;
    private BigDecimal amount;
    private PaymentStatus status;
    private PaymentMethodType paymentMethod;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}