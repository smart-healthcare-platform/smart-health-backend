package com.smarthealth.medicine.model;

import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PrescriptionResponse {

    private Long prescriptionId;
    private PrescriptionStatus status;
}