package fit.iuh.billing.controller;

import fit.iuh.billing.dto.admin.*;
import fit.iuh.billing.services.admin.AdminBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for billing statistics and analytics
 * Protected by InternalRequestFilter - requires gateway authentication
 * 
 * All endpoints require:
 * - X-Internal-Request: true
 * - X-Gateway-Secret: <matching gateway secret>
 */
@RestController
@RequestMapping("/api/v1/admin/billing")
@CrossOrigin(origins = "*")
public class AdminBillingController {

    private static final Logger logger = LoggerFactory.getLogger(AdminBillingController.class);
    
    @Autowired
    private AdminBillingService adminBillingService;
    
    /**
     * GET /api/v1/admin/billing/revenue/stats
     * Get overall revenue statistics
     * 
     * Response: { success: true, data: { totalRevenue, todayRevenue, ... } }
     */
    @GetMapping("/revenue/stats")
    public ResponseEntity<ApiResponse<RevenueStatsDTO>> getRevenueStats() {
        try {
            logger.info("Admin endpoint: Get revenue stats");
            RevenueStatsDTO stats = adminBillingService.getRevenueStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Revenue statistics retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error getting revenue stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve revenue statistics", e.getMessage()));
        }
    }
    
    /**
     * GET /api/v1/admin/billing/revenue/distribution
     * Get revenue distribution by payment methods, types, and status
     * 
     * Response: { success: true, data: { byPaymentMethod: [...], byPaymentType: [...], ... } }
     */
    @GetMapping("/revenue/distribution")
    public ResponseEntity<ApiResponse<RevenueDistributionDTO>> getRevenueDistribution() {
        try {
            logger.info("Admin endpoint: Get revenue distribution");
            RevenueDistributionDTO distribution = adminBillingService.getRevenueDistribution();
            return ResponseEntity.ok(ApiResponse.success(distribution, "Revenue distribution retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error getting revenue distribution", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve revenue distribution", e.getMessage()));
        }
    }
    
    /**
     * GET /api/v1/admin/billing/revenue/trends
     * Get revenue trends over time
     * 
     * Query params:
     * - period: DAILY, WEEKLY, MONTHLY, YEARLY (default: DAILY)
     * - days: number of days to look back (default: 30)
     * 
     * Response: { success: true, data: { period, startDate, endDate, data: [...] } }
     */
    @GetMapping("/revenue/trends")
    public ResponseEntity<ApiResponse<RevenueTrendDTO>> getRevenueTrends(
            @RequestParam(required = false, defaultValue = "DAILY") String period,
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        try {
            logger.info("Admin endpoint: Get revenue trends - period: {}, days: {}", period, days);
            RevenueTrendDTO trends = adminBillingService.getRevenueTrends(period, days);
            return ResponseEntity.ok(ApiResponse.success(trends, "Revenue trends retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error getting revenue trends", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve revenue trends", e.getMessage()));
        }
    }
    
    /**
     * GET /api/v1/admin/billing/payment-methods/stats
     * Get payment method statistics
     * 
     * Response: { success: true, data: { methods: [...], mostUsedMethod, highestRevenueMethod } }
     */
    @GetMapping("/payment-methods/stats")
    public ResponseEntity<ApiResponse<PaymentMethodStatsDTO>> getPaymentMethodStats() {
        try {
            logger.info("Admin endpoint: Get payment method stats");
            PaymentMethodStatsDTO stats = adminBillingService.getPaymentMethodStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Payment method statistics retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error getting payment method stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve payment method statistics", e.getMessage()));
        }
    }
    
    /**
     * GET /api/v1/admin/billing/health
     * Health check for admin billing endpoints
     * This is for debugging purposes
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        logger.info("Admin billing health check");
        return ResponseEntity.ok(ApiResponse.success("Admin billing service is healthy"));
    }
}