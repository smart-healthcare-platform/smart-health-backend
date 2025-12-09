package fit.iuh.billing.services.admin;

import fit.iuh.billing.dto.admin.*;

/**
 * Service interface for admin billing operations
 * Provides statistics and analytics for admin dashboard
 */
public interface AdminBillingService {
    
    /**
     * Get overall revenue statistics
     * Includes total, today, month, year revenue and payment counts
     * 
     * @return RevenueStatsDTO containing revenue statistics
     */
    RevenueStatsDTO getRevenueStats();
    
    /**
     * Get revenue distribution by payment methods, types, and status
     * 
     * @return RevenueDistributionDTO containing distribution data
     */
    RevenueDistributionDTO getRevenueDistribution();
    
    /**
     * Get revenue trends over time
     * 
     * @param period Period type: DAILY, WEEKLY, MONTHLY, YEARLY
     * @param days Number of days to look back (default 30 for DAILY)
     * @return RevenueTrendDTO containing trend data
     */
    RevenueTrendDTO getRevenueTrends(String period, Integer days);
    
    /**
     * Get payment method statistics
     * Includes success rates, revenue per method, usage statistics
     * 
     * @return PaymentMethodStatsDTO containing method statistics
     */
    PaymentMethodStatsDTO getPaymentMethodStats();
}