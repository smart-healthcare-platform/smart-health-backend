package com.smarthealth.medicine.model;

import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for patient's medication history
 * Shows previous prescriptions with full details for doctor review
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationHistoryDto {
    private String prescriptionId;
    private String appointmentId;
    private LocalDateTime prescribedDate;
    private String diagnosis;
    private String doctorName;
    private String notes;
    private PrescriptionStatus status;
    private List<PrescriptionItemDto> items;
    private Integer totalDrugs;  // Số loại thuốc trong đơn
}
