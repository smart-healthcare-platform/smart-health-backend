package com.smarthealth.medicine.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePrescriptionRequest {

    @NotNull
    private Long patientId;
    
    @NotNull
    private Long doctorId;

    private String diagnosis;

    private String notes;

    @NotEmpty
    @Valid
    private List<PrescriptionItemDto> items;
}