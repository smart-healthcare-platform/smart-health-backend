package com.smarthealth.medicine.controller;

import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<PrescriptionResponse> createPrescription(@Valid @RequestBody CreatePrescriptionRequest request) {
        PrescriptionResponse response = prescriptionService.createPrescription(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}