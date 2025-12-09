package com.smarthealth.medicine.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating a new prescription template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTemplateRequest {
    
    @NotBlank(message = "Template name is required")
    @Size(max = 200, message = "Template name must not exceed 200 characters")
    private String templateName;
    
    @Size(max = 500, message = "Diagnosis must not exceed 500 characters")
    private String diagnosis;
    
    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
    
    @NotEmpty(message = "At least one drug item is required")
    @Valid
    private List<TemplateItemInput> items;
}
