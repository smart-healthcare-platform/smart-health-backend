package com.smarthealth.medicine.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a prescription template
 * Doctors can create templates for commonly prescribed medication combinations
 */
@Entity
@Table(name = "prescription_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false, length = 100)
    private String doctorId;

    @Column(name = "template_name", nullable = false, length = 200)
    private String templateName;

    @Column(name = "diagnosis", length = 500)
    private String diagnosis;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PrescriptionTemplateItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Helper method to add an item to the template
     */
    public void addItem(PrescriptionTemplateItem item) {
        items.add(item);
        item.setTemplate(this);
    }

    /**
     * Helper method to remove an item from the template
     */
    public void removeItem(PrescriptionTemplateItem item) {
        items.remove(item);
        item.setTemplate(null);
    }
}
