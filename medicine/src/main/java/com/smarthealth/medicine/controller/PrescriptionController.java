package com.smarthealth.medicine.controller;

import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.DrugFrequencyDto;
import com.smarthealth.medicine.model.MedicationHistoryDto;
import com.smarthealth.medicine.model.PrescriptionDetailDto;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.model.PrescriptionSummaryDto;
import com.smarthealth.medicine.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping("/prescriptions")
    public ResponseEntity<PrescriptionResponse> createPrescription(@Valid @RequestBody CreatePrescriptionRequest request) {
        log.info("📥 Received createPrescription request:");
        log.info("   Patient ID: {}", request.getPatientId());
        log.info("   Doctor ID: {}", request.getDoctorId());
        log.info("   Appointment ID: {}", request.getAppointmentId());
        log.info("   Items count: {}", request.getItems() != null ? request.getItems().size() : 0);
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            request.getItems().forEach(item -> 
                log.info("     - Drug ID: {}, Dosage: {}, Frequency: {}, Duration: {} days", 
                    item.getDrugId(), item.getDosage(), item.getFrequency(), item.getDurationDays())
            );
        }
        
        PrescriptionResponse response = prescriptionService.createPrescription(request);
        
        log.info("✅ Prescription created successfully with ID: {}", response.getPrescriptionId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<PrescriptionDetailDto> getPrescriptionById(@PathVariable String id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
    }

    @GetMapping("/appointments/{appointmentId}/prescription")
    public ResponseEntity<PrescriptionDetailDto> getPrescriptionByAppointment(@PathVariable String appointmentId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionByAppointmentId(appointmentId));
    }

    @GetMapping("/patients/{patientId}/prescriptions")
    public ResponseEntity<List<PrescriptionSummaryDto>> getPrescriptionsByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatientId(patientId));
    }

    @PostMapping("/prescriptions/{id}/mark-printed")
    public ResponseEntity<Void> markAsPrinted(@PathVariable String id) {
        log.info("Request to mark prescription as printed: {}", id);
        prescriptionService.markAsPrinted(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/prescriptions/{id}/cancel")
    public ResponseEntity<Void> cancelPrescription(@PathVariable String id) {
        log.info("Request to cancel prescription: {}", id);
        prescriptionService.cancelPrescription(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Get patient's medication history
     * Used by doctors during examination to review patient's drug history
     */
    @GetMapping("/patients/{patientId}/medication-history")
    public ResponseEntity<List<MedicationHistoryDto>> getPatientMedicationHistory(
            @PathVariable String patientId,
            @RequestParam(required = false) Integer months
    ) {
        log.info("Getting medication history for patient: {} (last {} months)", patientId, months);
        return ResponseEntity.ok(prescriptionService.getPatientMedicationHistory(patientId, months));
    }

    /**
     * Get drug usage frequency for patient
     * Shows which drugs patient has been prescribed most frequently
     */
    @GetMapping("/patients/{patientId}/drug-frequency")
    public ResponseEntity<List<DrugFrequencyDto>> getPatientDrugFrequency(@PathVariable String patientId) {
        log.info("Getting drug frequency for patient: {}", patientId);
        return ResponseEntity.ok(prescriptionService.getPatientDrugFrequency(patientId));
    }
}