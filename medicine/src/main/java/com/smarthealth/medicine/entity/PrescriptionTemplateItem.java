package com.smarthealth.medicine.entity;

import com.smarthealth.medicine.domain.model.Drug;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing an item in a prescription template
 */
@Entity
@Table(name = "prescription_template_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private PrescriptionTemplate template;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drug_id", nullable = false)
    private Drug drug;

    @Column(name = "dosage", nullable = false, length = 100)
    private String dosage;

    @Column(name = "frequency", nullable = false, length = 100)
    private String frequency;

    @Column(name = "route", length = 50)
    private String route;

    @Column(name = "timing", length = 100)
    private String timing;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "special_instructions", length = 500)
    private String specialInstructions;
}
