package fit.iuh.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO để gửi thông tin xác nhận thanh toán cho Appointment Service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPaymentRequest {
    
    /**
     * Payment ID từ Billing Service
     */
    private String paymentId;
    
    /**
     * Số tiền đã thanh toán
     */
    private BigDecimal amount;
}
