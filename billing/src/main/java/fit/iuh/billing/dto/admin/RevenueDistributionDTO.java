package fit.iuh.billing.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for revenue distribution by payment methods and types
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDistributionDTO {
    
    private List<PaymentMethodDistribution> byPaymentMethod;
    private List<PaymentTypeDistribution> byPaymentType;
    private List<PaymentStatusDistribution> byStatus;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodDistribution {
        private String method; // MOMO, VNPAY, COD
        private Long count;
        private BigDecimal amount;
        private Double percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentTypeDistribution {
        private String type; // APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION
        private Long count;
        private BigDecimal amount;
        private Double percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentStatusDistribution {
        private String status; // PENDING, COMPLETED, FAILED, EXPIRED
        private Long count;
        private BigDecimal amount;
        private Double percentage;
    }
}