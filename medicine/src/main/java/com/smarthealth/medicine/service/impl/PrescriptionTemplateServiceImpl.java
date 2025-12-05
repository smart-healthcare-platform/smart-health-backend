package com.smarthealth.medicine.service.impl;

import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.entity.PrescriptionTemplate;
import com.smarthealth.medicine.entity.PrescriptionTemplateItem;
import com.smarthealth.medicine.exception.ResourceNotFoundException;
import com.smarthealth.medicine.model.CreateTemplateRequest;
import com.smarthealth.medicine.model.PrescriptionTemplateDto;
import com.smarthealth.medicine.model.PrescriptionTemplateItemDto;
import com.smarthealth.medicine.model.TemplateItemInput;
import com.smarthealth.medicine.domain.repository.DrugRepository;
import com.smarthealth.medicine.repository.PrescriptionTemplateRepository;
import com.smarthealth.medicine.service.PrescriptionTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of PrescriptionTemplateService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionTemplateServiceImpl implements PrescriptionTemplateService {

    private final PrescriptionTemplateRepository templateRepository;
    private final DrugRepository drugRepository;

    @Override
    @Transactional
    public PrescriptionTemplateDto createTemplate(String doctorId, CreateTemplateRequest request) {
        log.info("Creating template '{}' for doctor: {}", request.getTemplateName(), doctorId);

        // Check if template name already exists for this doctor
        if (templateRepository.existsByDoctorIdAndTemplateName(doctorId, request.getTemplateName())) {
            throw new IllegalArgumentException("Template with name '" + request.getTemplateName() + "' already exists");
        }

        // Create template entity
        PrescriptionTemplate template = PrescriptionTemplate.builder()
                .doctorId(doctorId)
                .templateName(request.getTemplateName())
                .diagnosis(request.getDiagnosis())
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        // Add items
        for (TemplateItemInput itemInput : request.getItems()) {
            Drug drug = drugRepository.findById(itemInput.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + itemInput.getDrugId()));

            PrescriptionTemplateItem item = PrescriptionTemplateItem.builder()
                    .drug(drug)
                    .dosage(itemInput.getDosage())
                    .frequency(itemInput.getFrequency())
                    .route(itemInput.getRoute())
                    .timing(itemInput.getTiming())
                    .durationDays(itemInput.getDurationDays())
                    .specialInstructions(itemInput.getSpecialInstructions())
                    .build();

            template.addItem(item);
        }

        PrescriptionTemplate savedTemplate = templateRepository.save(template);
        log.info("Template created successfully with ID: {}", savedTemplate.getId());

        return toTemplateDto(savedTemplate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionTemplateDto> getDoctorTemplates(String doctorId) {
        log.info("Fetching all templates for doctor: {}", doctorId);
        List<PrescriptionTemplate> templates = templateRepository.findByDoctorIdOrderByUpdatedAtDesc(doctorId);
        return templates.stream()
                .map(this::toTemplateDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionTemplateDto getTemplateById(String doctorId, Long templateId) {
        log.info("Fetching template {} for doctor: {}", templateId, doctorId);
        PrescriptionTemplate template = templateRepository.findByIdAndDoctorId(templateId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found or access denied"));
        return toTemplateDto(template);
    }

    @Override
    @Transactional
    public PrescriptionTemplateDto updateTemplate(String doctorId, Long templateId, CreateTemplateRequest request) {
        log.info("Updating template {} for doctor: {}", templateId, doctorId);

        PrescriptionTemplate template = templateRepository.findByIdAndDoctorId(templateId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found or access denied"));

        // Check if new name conflicts with existing template (excluding current template)
        if (!template.getTemplateName().equals(request.getTemplateName()) &&
                templateRepository.existsByDoctorIdAndTemplateName(doctorId, request.getTemplateName())) {
            throw new IllegalArgumentException("Template with name '" + request.getTemplateName() + "' already exists");
        }

        // Update basic fields
        template.setTemplateName(request.getTemplateName());
        template.setDiagnosis(request.getDiagnosis());
        template.setNotes(request.getNotes());

        // Clear existing items and add new ones
        template.getItems().clear();

        for (TemplateItemInput itemInput : request.getItems()) {
            Drug drug = drugRepository.findById(itemInput.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + itemInput.getDrugId()));

            PrescriptionTemplateItem item = PrescriptionTemplateItem.builder()
                    .drug(drug)
                    .dosage(itemInput.getDosage())
                    .frequency(itemInput.getFrequency())
                    .route(itemInput.getRoute())
                    .timing(itemInput.getTiming())
                    .durationDays(itemInput.getDurationDays())
                    .specialInstructions(itemInput.getSpecialInstructions())
                    .build();

            template.addItem(item);
        }

        PrescriptionTemplate updatedTemplate = templateRepository.save(template);
        log.info("Template updated successfully: {}", templateId);

        return toTemplateDto(updatedTemplate);
    }

    @Override
    @Transactional
    public void deleteTemplate(String doctorId, Long templateId) {
        log.info("Deleting template {} for doctor: {}", templateId, doctorId);

        PrescriptionTemplate template = templateRepository.findByIdAndDoctorId(templateId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found or access denied"));

        templateRepository.delete(template);
        log.info("Template deleted successfully: {}", templateId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrescriptionTemplateDto> searchTemplates(String doctorId, String searchTerm) {
        log.info("Searching templates for doctor {} with term: {}", doctorId, searchTerm);
        List<PrescriptionTemplate> templates = templateRepository.searchByTemplateName(doctorId, searchTerm);
        return templates.stream()
                .map(this::toTemplateDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert PrescriptionTemplate entity to DTO
     */
    private PrescriptionTemplateDto toTemplateDto(PrescriptionTemplate template) {
        List<PrescriptionTemplateItemDto> itemDtos = template.getItems().stream()
                .map(item -> PrescriptionTemplateItemDto.builder()
                        .id(item.getId())
                        .drugId(item.getDrug().getId())
                        .drugName(item.getDrug().getName())
                        .activeIngredient(item.getDrug().getActiveIngredient())
                        .strength(item.getDrug().getStrength())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .route(item.getRoute())
                        .timing(item.getTiming())
                        .durationDays(item.getDurationDays())
                        .specialInstructions(item.getSpecialInstructions())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionTemplateDto.builder()
                .id(template.getId())
                .doctorId(template.getDoctorId())
                .templateName(template.getTemplateName())
                .diagnosis(template.getDiagnosis())
                .notes(template.getNotes())
                .items(itemDtos)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .totalDrugs(itemDtos.size())
                .build();
    }
}
