package com.smarthealth.medicine.service;

import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.PrescriptionDetailDto;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.model.PrescriptionSummaryDto;

import java.util.List;

public interface PrescriptionService {

    PrescriptionResponse createPrescription(CreatePrescriptionRequest request);

    PrescriptionDetailDto getPrescriptionById(Long id);

    List<PrescriptionSummaryDto> getPrescriptionsByPatientId(String patientId);

    void confirmPayment(Long prescriptionId);

}