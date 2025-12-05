package fit.iuh.billing.controller;

import fit.iuh.billing.dto.admin.ApiResponse;
import fit.iuh.billing.dto.receptionist.DailyStatisticsDTO;
import fit.iuh.billing.services.receptionist.ReceptionistBillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST Controller for Receptionist Billing Operations
 * Handles payment statistics and daily revenue tracking for reception desk
 * 
 * @author Smart Health Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/v1/billings/receptionist")
@Tag(name = "Receptionist Billing", description = "APIs for receptionist payment statistics and operations")
public class ReceptionistBillingController {

    private static final Logger logger = LoggerFactory.getLogger(ReceptionistBillingController.class);

    @Autowired
    private ReceptionistBillingService receptionistBillingService;

    /**
     * GET /api/v1/billings/receptionist/daily-statistics
     * Get daily statistics for receptionist dashboard
     * 
     * Query params:
     * - date: Optional date (format: yyyy-MM-dd), defaults to today
     * 
     * Response includes:
     * - Total revenue by payment type (APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION)
     * - Total revenue by payment method (CASH, MOMO, VNPAY)
     * - Transaction counts
     * - Today's summary
     * 
     * @param date Optional date parameter (defaults to today)
     * @return DailyStatisticsDTO with comprehensive daily statistics
     */
    @GetMapping("/daily-statistics")
    @Operation(
        summary = "Get daily payment statistics",
        description = "Get comprehensive payment statistics for a specific date. Includes breakdown by payment type and method. Defaults to today if no date provided."
    )
    public ResponseEntity<ApiResponse<DailyStatisticsDTO>> getDailyStatistics(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
            LocalDate date
    ) {
        try {
            LocalDate targetDate = date != null ? date : LocalDate.now();
            logger.info("Receptionist endpoint: Get daily statistics for date: {}", targetDate);
            
            DailyStatisticsDTO statistics = receptionistBillingService.getDailyStatistics(targetDate);
            
            return ResponseEntity.ok(
                ApiResponse.success(
                    statistics, 
                    "Daily statistics retrieved successfully for " + targetDate
                )
            );
        } catch (Exception e) {
            logger.error("Error retrieving daily statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve daily statistics", e.getMessage()));
        }
    }

    /**
     * GET /api/v1/billings/receptionist/today-summary
     * Get quick summary for today (optimized endpoint)
     * 
     * @return Simplified today's statistics
     */
    @GetMapping("/today-summary")
    @Operation(
        summary = "Get today's quick summary",
        description = "Get quick summary of today's payments - optimized for dashboard widgets"
    )
    public ResponseEntity<ApiResponse<DailyStatisticsDTO>> getTodaySummary() {
        try {
            logger.info("Receptionist endpoint: Get today's summary");
            
            DailyStatisticsDTO statistics = receptionistBillingService.getDailyStatistics(LocalDate.now());
            
            return ResponseEntity.ok(
                ApiResponse.success(statistics, "Today's summary retrieved successfully")
            );
        } catch (Exception e) {
            logger.error("Error retrieving today's summary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve today's summary", e.getMessage()));
        }
    }
}