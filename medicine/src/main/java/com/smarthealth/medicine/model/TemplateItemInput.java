package com.smarthealth.medicine.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for template item input
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateItemInput {
    
    @NotNull(message = "Drug ID is required")
    @Positive(message = "Drug ID must be positive")
    private Long drugId;
    
    @NotBlank(message = "Dosage is required")
    @Size(max = 100, message = "Dosage must not exceed 100 characters")
    private String dosage;
    
    @NotBlank(message = "Frequency is required")
    @Size(max = 100, message = "Frequency must not exceed 100 characters")
    private String frequency;
    
    @Size(max = 50, message = "Route must not exceed 50 characters")
    private String route;
    
    @Size(max = 100, message = "Timing must not exceed 100 characters")
    private String timing;
    
    @Positive(message = "Duration must be positive")
    private Integer durationDays;
    
    @Size(max = 500, message = "Special instructions must not exceed 500 characters")
    private String specialInstructions;
}
