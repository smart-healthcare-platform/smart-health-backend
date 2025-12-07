package fit.iuh.billing.services.receptionist;

import fit.iuh.billing.dto.receptionist.DailyStatisticsDTO;

import java.time.LocalDate;

/**
 * Service interface for receptionist billing operations
 * Provides payment statistics and daily revenue tracking for reception desk
 * 
 * @author Smart Health Team
 * @version 1.0
 */
public interface ReceptionistBillingService {
    
    /**
     * Get daily payment statistics for a specific date
     * Includes breakdown by payment type and payment method
     * 
     * @param date The date to get statistics for
     * @return DailyStatisticsDTO containing comprehensive daily statistics
     */
    DailyStatisticsDTO getDailyStatistics(LocalDate date);
}