package com.smarthealth.medicine.model;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PrescriptionItemDto {

    @NotNull
    private Long drugId;

    private String dosage;

    private String frequency;

    private String route;

    private String timing;

    private Integer durationDays;
}