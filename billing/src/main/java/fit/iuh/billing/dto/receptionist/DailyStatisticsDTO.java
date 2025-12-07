package fit.iuh.billing.dto.receptionist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for daily payment statistics in receptionist dashboard
 * Provides comprehensive breakdown of revenue and transactions
 * 
 * @author Smart Health Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStatisticsDTO {
    
    /**
     * Date for these statistics
     */
    private LocalDate date;
    
    /**
     * Total revenue for the day (all payment types, completed only)
     */
    private BigDecimal totalRevenue;
    
    /**
     * Total number of completed transactions
     */
    private Long totalTransactions;
    
    /**
     * Number of pending/processing transactions
     */
    private Long pendingTransactions;
    
    /**
     * Number of failed transactions
     */
    private Long failedTransactions;
    
    /**
     * Breakdown by payment type
     */
    private List<PaymentTypeBreakdown> paymentTypeBreakdown;
    
    /**
     * Breakdown by payment method
     */
    private List<PaymentMethodBreakdown> paymentMethodBreakdown;
    
    /**
     * Cash revenue (for cash drawer reconciliation)
     */
    private BigDecimal cashRevenue;
    
    /**
     * Online revenue (MOMO + VNPAY)
     */
    private BigDecimal onlineRevenue;
    
    /**
     * Average transaction amount
     */
    private BigDecimal averageTransactionAmount;
    
    /**
     * Breakdown by payment type
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentTypeBreakdown {
        /**
         * Payment type: APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION, OTHER
         */
        private String paymentType;
        
        /**
         * Total revenue for this payment type
         */
        private BigDecimal revenue;
        
        /**
         * Number of transactions
         */
        private Long transactionCount;
        
        /**
         * Percentage of total revenue
         */
        private Double percentage;
    }
    
    /**
     * Breakdown by payment method
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodBreakdown {
        /**
         * Payment method: CASH, MOMO, VNPAY, COD
         */
        private String paymentMethod;
        
        /**
         * Total revenue for this method
         */
        private BigDecimal revenue;
        
        /**
         * Number of transactions
         */
        private Long transactionCount;
        
        /**
         * Percentage of total revenue
         */
        private Double percentage;
    }
}