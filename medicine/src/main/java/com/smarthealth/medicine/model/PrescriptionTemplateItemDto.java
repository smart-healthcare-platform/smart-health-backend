package com.smarthealth.medicine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for prescription template item
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateItemDto {
    private Long id;
    private Long drugId;
    private String drugName;
    private String activeIngredient;
    private String strength;
    private String dosage;
    private String frequency;
    private String route;
    private String timing;
    private Integer durationDays;
    private String specialInstructions;
}
