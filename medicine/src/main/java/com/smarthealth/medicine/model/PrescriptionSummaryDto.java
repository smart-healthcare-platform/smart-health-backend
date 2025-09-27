package com.smarthealth.medicine.model;

import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionSummaryDto {
    private Long id;
    private Long patientId;
    private String diagnosis;
    private PrescriptionStatus status;
    private LocalDateTime createdAt;
}