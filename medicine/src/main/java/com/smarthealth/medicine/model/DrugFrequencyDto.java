package com.smarthealth.medicine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for drug usage frequency statistics
 * Shows how often a patient has been prescribed specific drugs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrugFrequencyDto {
    private Long drugId;
    private String drugName;
    private String activeIngredient;
    private String strength;
    private Integer prescriptionCount;      // Số lần được kê
    private LocalDateTime lastPrescribed;   // Lần gần nhất
    private LocalDateTime firstPrescribed;  // Lần đầu tiên
    private String mostCommonDosage;        // Liều dùng phổ biến nhất
}
