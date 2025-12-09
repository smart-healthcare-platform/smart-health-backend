package com.smarthealth.medicine.client;

import com.smarthealth.medicine.client.dto.PatientDto;
import java.util.Optional;

/**
 * An interface that abstracts the communication with the Patient Service.
 * This allows for different implementations, such as a real REST client
 * or a fake client for development and testing.
 */
public interface PatientClient {

    /**
     * Fetches a patient by their unique identifier.
     *
     * @param patientId The ID of the patient to retrieve.
     * @return An {@link Optional} containing the {@link PatientDto} if found,
     *         or an empty Optional if not found.
     */
    Optional<PatientDto> getPatientById(String patientId);
}