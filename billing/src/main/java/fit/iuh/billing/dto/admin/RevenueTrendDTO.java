package fit.iuh.billing.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for revenue trends over time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTrendDTO {
    
    private String period; // DAILY, WEEKLY, MONTHLY, YEARLY
    private LocalDate startDate;
    private LocalDate endDate;
    private List<TrendDataPoint> data;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataPoint {
        private String label; // Date or period label
        private LocalDate date;
        private BigDecimal revenue;
        private Long paymentCount;
        private BigDecimal averageAmount;
    }
}