package fit.iuh.billing.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for revenue statistics in admin dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueStatsDTO {
    
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private BigDecimal yearRevenue;
    
    private Long totalPayments;
    private Long completedPayments;
    private Long pendingPayments;
    private Long failedPayments;
    
    private BigDecimal averagePaymentAmount;
    private Double completionRate; // Percentage of completed payments
    
    // Growth metrics
    private Double revenueGrowthRate; // Compared to previous period
    private Double paymentGrowthRate; // Compared to previous period
}