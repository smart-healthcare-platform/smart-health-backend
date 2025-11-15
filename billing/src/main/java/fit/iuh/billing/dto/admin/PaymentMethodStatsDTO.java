package fit.iuh.billing.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for payment method statistics in admin dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodStatsDTO {
    
    private List<MethodStats> methods;
    private String mostUsedMethod;
    private String highestRevenueMethod;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MethodStats {
        private String method; // MOMO, VNPAY, COD
        private Long totalTransactions;
        private Long successfulTransactions;
        private Long failedTransactions;
        private Long pendingTransactions;
        
        private BigDecimal totalRevenue;
        private BigDecimal averageTransactionAmount;
        
        private Double successRate; // Percentage
        private Double revenuePercentage; // Percentage of total revenue
        private Double usagePercentage; // Percentage of total transactions
    }
}