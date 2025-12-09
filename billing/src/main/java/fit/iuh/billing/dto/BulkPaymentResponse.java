package fit.iuh.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for bulk payment processing
 * Provides detailed feedback about which payments were processed
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkPaymentResponse {
    
    /**
     * Total number of payments requested
     */
    private int totalRequested;
    
    /**
     * Number of payments successfully processed
     */
    private int successfullyProcessed;
    
    /**
     * Number of payments that were already completed (skipped)
     */
    private int alreadyCompleted;
    
    /**
     * Total amount processed (excluding already completed)
     */
    private BigDecimal amountProcessed;
    
    /**
     * Total amount that was already paid
     */
    private BigDecimal amountAlreadyPaid;
    
    /**
     * Overall message
     */
    private String message;
    
    /**
     * List of processed payment codes
     */
    private List<String> processedPaymentCodes;
    
    /**
     * List of skipped payment codes (already completed)
     */
    private List<String> skippedPaymentCodes;
    
    /**
     * Payment method used
     */
    private String paymentMethod;
}