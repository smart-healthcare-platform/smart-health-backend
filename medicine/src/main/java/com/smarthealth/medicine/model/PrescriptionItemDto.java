package com.smarthealth.medicine.model;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItemDto {

    @NotNull
    private Long drugId;

    private String drugName;

    private String dosage;

    private String quantity;

    private String instructions;

    private String frequency;

    private String route;

    private String timing;

    private Integer durationDays;

    private String notes;
}