package fit.iuh.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for outstanding payments query
 * Contains all payments (paid and unpaid) related to an appointment
 * Used by receptionist to view and process payment consolidation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingPaymentResponse {
    /**
     * Appointment ID
     */
    private String appointmentId;

    /**
     * Patient name (for display purposes)
     */
    private String patientName;

    /**
     * Total amount that hasn't been paid yet
     */
    private BigDecimal totalUnpaid;

    /**
     * Total amount that has been paid
     */
    private BigDecimal totalPaid;

    /**
     * List of all payment items (both paid and unpaid)
     * Includes appointment fee, lab tests, and other charges
     */
    private List<PaymentItemDto> payments;
}
