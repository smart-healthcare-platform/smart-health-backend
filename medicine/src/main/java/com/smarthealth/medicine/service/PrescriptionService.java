package com.smarthealth.medicine.service;

import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.PrescriptionResponse;

public interface PrescriptionService {
    PrescriptionResponse createPrescription(CreatePrescriptionRequest request);
}