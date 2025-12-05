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
import com.smarthealth.medicine.model.DrugFrequencyDto;
import com.smarthealth.medicine.model.MedicationHistoryDto;
import com.smarthealth.medicine.model.PrescriptionDetailDto;
import com.smarthealth.medicine.model.PrescriptionItemDto;
import com.smarthealth.medicine.exception.ResourceNotFoundException;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.model.PrescriptionSummaryDto;
import com.smarthealth.medicine.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DrugRepository drugRepository;
    private final PatientClient patientClient;

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        log.info("=== Creating prescription with {} items ===", request.getItems() != null ? request.getItems().size() : 0);
        log.debug("Request details: patientId={}, doctorId={}, appointmentId={}", 
            request.getPatientId(), request.getDoctorId(), request.getAppointmentId());
        
        // Step 1: Validate patient by calling Patient Service through the client interface
        PatientDto patient = patientClient.getPatientById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        
        log.info("Patient validated: {}", patient.name());

        // TODO: (Future - Day 5) Use patient.allergies() for CDSS checks

        // Step 2: Create and save the prescription
        Prescription prescription = new Prescription();
        prescription.setPatientId(request.getPatientId());
        prescription.setPatientName(request.getPatientName() != null ? request.getPatientName() : patient.name());
        prescription.setDoctorId(request.getDoctorId());
        prescription.setDoctorName(request.getDoctorName());
        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setStatus(PrescriptionStatus.ACTIVE);

        log.info("Processing {} prescription items...", request.getItems().size());
        
        int itemCount = 0;
        for (PrescriptionItemDto itemDto : request.getItems()) {
            itemCount++;
            log.info("Processing item #{} - drugId: {}", itemCount, itemDto.getDrugId());
            
            Drug drug = drugRepository.findById(itemDto.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with id: " + itemDto.getDrugId()));
            
            log.info("Found drug: {} ({})", drug.getName(), drug.getActiveIngredient());

            PrescriptionItem item = new PrescriptionItem();
            item.setDrug(drug);
            item.setDosage(itemDto.getDosage());
            item.setFrequency(itemDto.getFrequency());
            item.setRoute(itemDto.getRoute());
            item.setTiming(itemDto.getTiming());
            item.setDurationDays(itemDto.getDurationDays());

            // Use the helper method to sync both sides of the relationship
            prescription.addItem(item);
            log.debug("Added item to prescription. Total items in prescription: {}", prescription.getItems().size());
        }

        log.info("Saving prescription with {} items...", prescription.getItems().size());
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        log.info("✅ Prescription saved successfully! ID: {}, Items count: {}",  
            savedPrescription.getId(), savedPrescription.getItems().size());

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
    public PrescriptionDetailDto getPrescriptionByAppointmentId(String appointmentId) {
        log.info("Getting prescription for appointment: {}", appointmentId);
        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for appointment: " + appointmentId));
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
                        .drugName(item.getDrug().getName())
                        .dosage(item.getDosage())
                        .quantity(item.getQuantity() != null ? item.getQuantity().toString() : null)
                        .instructions(buildInstructions(item))
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .timing(item.getTiming())
                        .durationDays(item.getDurationDays())
                        .notes(item.getNotes())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionDetailDto.builder()
                .id(prescription.getId())
                .patientId(prescription.getPatientId())
                .patientName(prescription.getPatientName())
                .doctorId(prescription.getDoctorId())
                .doctorName(prescription.getDoctorName())
                .appointmentId(prescription.getAppointmentId())
                .diagnosis(prescription.getDiagnosis())
                .notes(prescription.getNotes())
                .status(prescription.getStatus())
                .createdAt(prescription.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    /**
     * Build human-readable instructions from item fields
     */
    private String buildInstructions(PrescriptionItem item) {
        StringBuilder sb = new StringBuilder();
        if (item.getFrequency() != null) {
            sb.append(item.getFrequency());
        }
        if (item.getTiming() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(item.getTiming());
        }
        if (item.getRoute() != null) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append("Đường: ").append(item.getRoute());
        }
        if (item.getDurationDays() != null && item.getDurationDays() > 0) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append("Dùng ").append(item.getDurationDays()).append(" ngày");
        }
        return sb.length() > 0 ? sb.toString() : "Theo chỉ dẫn bác sĩ";
    }

    @Override
    @Transactional
    public void markAsPrinted(String prescriptionId) {
        log.info("Marking prescription as printed: {}", prescriptionId);
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));
        
        if (prescription.getStatus() == PrescriptionStatus.CANCELLED) {
            throw new IllegalStateException("Cannot print a cancelled prescription");
        }
        
        prescription.setStatus(PrescriptionStatus.PRINTED);
        prescriptionRepository.save(prescription);
        log.info("Prescription {} marked as PRINTED", prescriptionId);
    }

    @Override
    @Transactional
    public void cancelPrescription(String prescriptionId) {
        log.info("Cancelling prescription: {}", prescriptionId);
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));
        
        if (prescription.getStatus() == PrescriptionStatus.PRINTED) {
            throw new IllegalStateException("Cannot cancel a prescription that has already been printed");
        }
        
        prescription.setStatus(PrescriptionStatus.CANCELLED);
        prescriptionRepository.save(prescription);
        log.info("Prescription {} cancelled", prescriptionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MedicationHistoryDto> getPatientMedicationHistory(String patientId, Integer months) {
        log.info("Getting medication history for patient: {}, last {} months", patientId, months);
        
        List<Prescription> prescriptions;
        
        if (months != null && months > 0) {
            // Get prescriptions from last N months
            LocalDateTime fromDate = LocalDateTime.now().minusMonths(months);
            prescriptions = prescriptionRepository.findByPatientIdAndCreatedAtAfterOrderByCreatedAtDesc(
                patientId, fromDate
            );
        } else {
            // Get all prescriptions
            prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        }
        
        return prescriptions.stream()
                .map(this::toMedicationHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DrugFrequencyDto> getPatientDrugFrequency(String patientId) {
        log.info("Calculating drug frequency for patient: {}", patientId);
        
        // Get all prescriptions for patient
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
        
        // Map to track drug usage
        Map<Long, DrugFrequencyData> drugDataMap = new HashMap<>();
        
        for (Prescription prescription : prescriptions) {
            for (PrescriptionItem item : prescription.getItems()) {
                Drug drug = item.getDrug();
                Long drugId = drug.getId();
                
                DrugFrequencyData data = drugDataMap.getOrDefault(drugId, new DrugFrequencyData());
                data.drugId = drugId;
                data.drugName = drug.getName();
                data.activeIngredient = drug.getActiveIngredient();
                data.strength = drug.getStrength();
                data.count++;
                
                // Track dosages
                if (item.getDosage() != null) {
                    data.dosages.add(item.getDosage());
                }
                
                // Track first and last prescribed dates
                if (data.firstPrescribed == null || prescription.getCreatedAt().isBefore(data.firstPrescribed)) {
                    data.firstPrescribed = prescription.getCreatedAt();
                }
                if (data.lastPrescribed == null || prescription.getCreatedAt().isAfter(data.lastPrescribed)) {
                    data.lastPrescribed = prescription.getCreatedAt();
                }
                
                drugDataMap.put(drugId, data);
            }
        }
        
        // Convert to DTO and sort by frequency (descending)
        return drugDataMap.values().stream()
                .map(data -> DrugFrequencyDto.builder()
                        .drugId(data.drugId)
                        .drugName(data.drugName)
                        .activeIngredient(data.activeIngredient)
                        .strength(data.strength)
                        .prescriptionCount(data.count)
                        .lastPrescribed(data.lastPrescribed)
                        .firstPrescribed(data.firstPrescribed)
                        .mostCommonDosage(getMostCommonDosage(data.dosages))
                        .build())
                .sorted((a, b) -> b.getPrescriptionCount().compareTo(a.getPrescriptionCount()))
                .collect(Collectors.toList());
    }

    /**
     * Convert Prescription to MedicationHistoryDto
     */
    private MedicationHistoryDto toMedicationHistoryDto(Prescription prescription) {
        List<PrescriptionItemDto> itemDtos = prescription.getItems().stream()
                .map(item -> PrescriptionItemDto.builder()
                        .drugId(item.getDrug().getId())
                        .drugName(item.getDrug().getName())
                        .dosage(item.getDosage())
                        .quantity(item.getQuantity() != null ? item.getQuantity().toString() : null)
                        .instructions(buildInstructions(item))
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .timing(item.getTiming())
                        .durationDays(item.getDurationDays())
                        .notes(item.getNotes())
                        .build())
                .collect(Collectors.toList());
        
        return MedicationHistoryDto.builder()
                .prescriptionId(prescription.getId())
                .appointmentId(prescription.getAppointmentId())
                .prescribedDate(prescription.getCreatedAt())
                .diagnosis(prescription.getDiagnosis())
                .doctorName(prescription.getDoctorName())
                .notes(prescription.getNotes())
                .status(prescription.getStatus())
                .items(itemDtos)
                .totalDrugs(itemDtos.size())
                .build();
    }

    /**
     * Get most common dosage from list
     */
    private String getMostCommonDosage(List<String> dosages) {
        if (dosages.isEmpty()) return null;
        
        Map<String, Long> frequencyMap = dosages.stream()
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));
        
        return frequencyMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    /**
     * Helper class to track drug frequency data
     */
    private static class DrugFrequencyData {
        Long drugId;
        String drugName;
        String activeIngredient;
        String strength;
        Integer count = 0;
        LocalDateTime firstPrescribed;
        LocalDateTime lastPrescribed;
        List<String> dosages = new ArrayList<>();
    }
}