package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {
    private String prescriptionId;
    private BigDecimal amount;
    private PaymentMethodType paymentMethod;
}