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
import com.smarthealth.medicine.model.PrescriptionDetailDto;
import com.smarthealth.medicine.model.PrescriptionItemDto;
import com.smarthealth.medicine.exception.ResourceNotFoundException;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.model.PrescriptionSummaryDto;
import com.smarthealth.medicine.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));

        // TODO: (Future - Day 5) Use patient.allergies() for CDSS checks

        // Step 2: Create and save the prescription
        Prescription prescription = new Prescription();
        prescription.setPatientId(request.getPatientId());
        prescription.setDoctorId(request.getDoctorId());
        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setStatus(PrescriptionStatus.PENDING_PAYMENT);

        for (PrescriptionItemDto itemDto : request.getItems()) {
            Drug drug = drugRepository.findById(itemDto.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with id: " + itemDto.getDrugId()));

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

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDetailDto getPrescriptionById(String id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        return toDetailDto(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionSummaryDto> getPrescriptionsByPatientId(String patientId) {
        return prescriptionRepository.findByPatientId(patientId).stream()
                .map(p -> PrescriptionSummaryDto.builder()
                        .id(p.getId())
                        .patientId(p.getPatientId())
                        .appointmentId(p.getAppointmentId())
                        .diagnosis(p.getDiagnosis())
                        .status(p.getStatus())
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private PrescriptionDetailDto toDetailDto(Prescription prescription) {
        List<PrescriptionItemDto> itemDtos = prescription.getItems().stream()
                .map(item -> PrescriptionItemDto.builder()
                        .drugId(item.getDrug().getId())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .timing(item.getTiming())
                        .durationDays(item.getDurationDays())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionDetailDto.builder()
                .id(prescription.getId())
                .patientId(prescription.getPatientId())
                .doctorId(prescription.getDoctorId())
                .appointmentId(prescription.getAppointmentId())
                .diagnosis(prescription.getDiagnosis())
                .notes(prescription.getNotes())
                .status(prescription.getStatus())
                .createdAt(prescription.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    @Override
    @Transactional
    public void confirmPayment(String prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));
        prescription.setStatus(PrescriptionStatus.COMPLETED);
        prescriptionRepository.save(prescription);
    }
}