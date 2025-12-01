package com.smarthealth.medicine.controller;

import com.smarthealth.medicine.model.CreateTemplateRequest;
import com.smarthealth.medicine.model.PrescriptionTemplateDto;
import com.smarthealth.medicine.service.PrescriptionTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for prescription template operations
 */
@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
@Slf4j
public class PrescriptionTemplateController {

    private final PrescriptionTemplateService templateService;

    /**
     * Create a new prescription template
     */
    @PostMapping
    public ResponseEntity<PrescriptionTemplateDto> createTemplate(
            @RequestHeader("X-Doctor-Id") String doctorId,
            @Valid @RequestBody CreateTemplateRequest request) {
        log.info("POST /api/v1/templates - Doctor: {}, Template: {}", doctorId, request.getTemplateName());
        PrescriptionTemplateDto template = templateService.createTemplate(doctorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(template);
    }

    /**
     * Get all templates for the current doctor
     */
    @GetMapping
    public ResponseEntity<List<PrescriptionTemplateDto>> getDoctorTemplates(
            @RequestHeader("X-Doctor-Id") String doctorId) {
        log.info("GET /api/v1/templates - Doctor: {}", doctorId);
        List<PrescriptionTemplateDto> templates = templateService.getDoctorTemplates(doctorId);
        return ResponseEntity.ok(templates);
    }

    /**
     * Get a specific template by ID
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<PrescriptionTemplateDto> getTemplateById(
            @RequestHeader("X-Doctor-Id") String doctorId,
            @PathVariable Long templateId) {
        log.info("GET /api/v1/templates/{} - Doctor: {}", templateId, doctorId);
        PrescriptionTemplateDto template = templateService.getTemplateById(doctorId, templateId);
        return ResponseEntity.ok(template);
    }

    /**
     * Update an existing template
     */
    @PutMapping("/{templateId}")
    public ResponseEntity<PrescriptionTemplateDto> updateTemplate(
            @RequestHeader("X-Doctor-Id") String doctorId,
            @PathVariable Long templateId,
            @Valid @RequestBody CreateTemplateRequest request) {
        log.info("PUT /api/v1/templates/{} - Doctor: {}", templateId, doctorId);
        PrescriptionTemplateDto template = templateService.updateTemplate(doctorId, templateId, request);
        return ResponseEntity.ok(template);
    }

    /**
     * Delete a template
     */
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(
            @RequestHeader("X-Doctor-Id") String doctorId,
            @PathVariable Long templateId) {
        log.info("DELETE /api/v1/templates/{} - Doctor: {}", templateId, doctorId);
        templateService.deleteTemplate(doctorId, templateId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search templates by name
     */
    @GetMapping("/search")
    public ResponseEntity<List<PrescriptionTemplateDto>> searchTemplates(
            @RequestHeader("X-Doctor-Id") String doctorId,
            @RequestParam String q) {
        log.info("GET /api/v1/templates/search?q={} - Doctor: {}", q, doctorId);
        List<PrescriptionTemplateDto> templates = templateService.searchTemplates(doctorId, q);
        return ResponseEntity.ok(templates);
    }
}
