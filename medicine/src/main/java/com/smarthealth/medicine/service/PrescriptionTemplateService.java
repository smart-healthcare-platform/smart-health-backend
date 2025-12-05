package com.smarthealth.medicine.service;

import com.smarthealth.medicine.model.CreateTemplateRequest;
import com.smarthealth.medicine.model.PrescriptionTemplateDto;

import java.util.List;

/**
 * Service interface for prescription template operations
 */
public interface PrescriptionTemplateService {

    /**
     * Create a new prescription template
     */
    PrescriptionTemplateDto createTemplate(String doctorId, CreateTemplateRequest request);

    /**
     * Get all templates for a doctor
     */
    List<PrescriptionTemplateDto> getDoctorTemplates(String doctorId);

    /**
     * Get a specific template by ID
     */
    PrescriptionTemplateDto getTemplateById(String doctorId, Long templateId);

    /**
     * Update an existing template
     */
    PrescriptionTemplateDto updateTemplate(String doctorId, Long templateId, CreateTemplateRequest request);

    /**
     * Delete a template
     */
    void deleteTemplate(String doctorId, Long templateId);

    /**
     * Search templates by name
     */
    List<PrescriptionTemplateDto> searchTemplates(String doctorId, String searchTerm);
}
