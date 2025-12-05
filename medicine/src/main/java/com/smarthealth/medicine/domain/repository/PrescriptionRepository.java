package com.smarthealth.medicine.domain.repository;

import com.smarthealth.medicine.domain.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {
    List<Prescription> findByPatientId(String patientId);
    Optional<Prescription> findByAppointmentId(String appointmentId);
    
    /**
     * Find prescriptions by patient ID, ordered by created date (newest first)
     */
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(String patientId);
    
    /**
     * Find prescriptions by patient ID created after a specific date
     * Used for getting medication history for last N months
     */
    List<Prescription> findByPatientIdAndCreatedAtAfterOrderByCreatedAtDesc(
        String patientId, 
        LocalDateTime createdAfter
    );
}