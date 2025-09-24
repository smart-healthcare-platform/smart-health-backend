package com.smarthealth.medicine.service.impl;

import com.smarthealth.medicine.client.PatientClient;
import com.smarthealth.medicine.client.dto.PatientDto;
import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.domain.model.Prescription;
import com.smarthealth.medicine.domain.model.PrescriptionItem;
import com.smarthealth.medicine.domain.repository.DrugRepository;
import com.smarthealth.medicine.domain.repository.PrescriptionRepository;
import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.PrescriptionItemDto;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.service.PrescriptionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DrugRepository drugRepository;
    private final PatientClient patientClient;

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        // Step 1: Validate patient by calling Patient Service through the client interface
        PatientDto patient = patientClient.getPatientById(request.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + request.getPatientId()));

        // TODO: (Future - Day 5) Use patient.allergies() for CDSS checks

        // Step 2: Create and save the prescription
        Prescription prescription = new Prescription();
        prescription.setPatientId(request.getPatientId());
        prescription.setDoctorId(request.getDoctorId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setStatus(PrescriptionStatus.PENDING_PAYMENT);

        for (PrescriptionItemDto itemDto : request.getItems()) {
            Drug drug = drugRepository.findById(itemDto.getDrugId())
                    .orElseThrow(() -> new EntityNotFoundException("Drug not found with id: " + itemDto.getDrugId()));

            PrescriptionItem item = new PrescriptionItem();
            item.setDrug(drug);
            item.setDosage(itemDto.getDosage());
            item.setFrequency(itemDto.getFrequency());
            item.setRoute(itemDto.getRoute());
            item.setTiming(itemDto.getTiming());
            item.setDurationDays(itemDto.getDurationDays());

            // Use the helper method to sync both sides of the relationship
            prescription.addItem(item);
        }

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // TODO: (Future - Day 6) Send event to Notification Service

        return new PrescriptionResponse(savedPrescription.getId(), savedPrescription.getStatus());
    }
}