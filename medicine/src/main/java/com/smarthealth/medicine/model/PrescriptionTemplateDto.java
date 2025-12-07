package com.smarthealth.medicine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for prescription template response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateDto {
    private Long id;
    private String doctorId;
    private String templateName;
    private String diagnosis;
    private String notes;
    private List<PrescriptionTemplateItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer totalDrugs;
}
