package com.smarthealth.medicine.client.impl;

import com.smarthealth.medicine.client.PatientClient;
import com.smarthealth.medicine.client.dto.PatientDto;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * A fake implementation of {@link PatientClient} for development and testing purposes.
 * This client is activated only when the "dev" Spring profile is active.
 * It simulates the behavior of the real Patient Service without making actual network calls.
 */
@Component
@Profile("dev")
public class FakePatientClient implements PatientClient {

    /**
     * Simulates fetching a patient by ID.
     * For any positive ID, it returns a hardcoded patient DTO.
     * This allows development to proceed without a running Patient Service.
     *
     * @param patientId The ID of the patient to retrieve.
     * @return An Optional containing a fake PatientDto if patientId is positive, otherwise an empty Optional.
     */
    @Override
    public Optional<PatientDto> getPatientById(String patientId) {
        // For local development, we can assume any non-empty patient ID is valid.
        if (patientId != null && !patientId.isBlank()) {
            // Return a mock patient with some known allergies for testing CDSS later.
            return Optional.of(new PatientDto(patientId, "Fake Patient Name", List.of("Aspirin")));
        }
        return Optional.empty();
    }
}