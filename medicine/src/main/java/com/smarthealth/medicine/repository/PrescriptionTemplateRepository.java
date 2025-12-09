package com.smarthealth.medicine.repository;

import com.smarthealth.medicine.entity.PrescriptionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PrescriptionTemplate entity
 */
@Repository
public interface PrescriptionTemplateRepository extends JpaRepository<PrescriptionTemplate, Long> {

    /**
     * Find all templates by doctor ID
     */
    List<PrescriptionTemplate> findByDoctorIdOrderByUpdatedAtDesc(String doctorId);

    /**
     * Find template by doctor ID and template name
     */
    Optional<PrescriptionTemplate> findByDoctorIdAndTemplateName(String doctorId, String templateName);

    /**
     * Find template by ID and doctor ID (for authorization check)
     */
    Optional<PrescriptionTemplate> findByIdAndDoctorId(Long id, String doctorId);

    /**
     * Check if template name exists for doctor
     */
    boolean existsByDoctorIdAndTemplateName(String doctorId, String templateName);

    /**
     * Search templates by name pattern (case-insensitive)
     */
    @Query("SELECT t FROM PrescriptionTemplate t WHERE t.doctorId = :doctorId AND LOWER(t.templateName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY t.updatedAt DESC")
    List<PrescriptionTemplate> searchByTemplateName(@Param("doctorId") String doctorId, @Param("searchTerm") String searchTerm);

    /**
     * Count templates by doctor ID
     */
    long countByDoctorId(String doctorId);
}
