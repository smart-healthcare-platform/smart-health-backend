package com.smarthealth.medicine.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePrescriptionRequest {

    @NotNull
    private String patientId;
    
    private String patientName;
    
    @NotNull
    private String doctorId;

    private String doctorName;

    private String appointmentId;

    private String diagnosis;

    private String notes;

    @NotEmpty
    @Valid
    private List<PrescriptionItemDto> items;
}