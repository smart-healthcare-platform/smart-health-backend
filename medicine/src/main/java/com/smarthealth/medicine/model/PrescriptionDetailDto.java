package com.smarthealth.medicine.model;

import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionDetailDto {
    private Long id;
    private String patientId;
    private String doctorId;
    private String appointmentId;
    private String diagnosis;
    private String notes;
    private PrescriptionStatus status;
    private LocalDateTime createdAt;
    private List<PrescriptionItemDto> items;
}