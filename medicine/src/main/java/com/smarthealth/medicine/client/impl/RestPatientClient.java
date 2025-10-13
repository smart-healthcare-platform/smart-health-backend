package com.smarthealth.medicine.client.impl;

import com.smarthealth.medicine.client.PatientClient;
import com.smarthealth.medicine.client.dto.PatientDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

/**
 * A REST-based implementation of {@link PatientClient} for production environments.
 * This client is activated when the "dev" Spring profile is NOT active.
 * It makes real HTTP calls to the Patient Service.
 */
@Component
@Profile("!dev")
@RequiredArgsConstructor
@Slf4j
public class RestPatientClient implements PatientClient {

    private final RestTemplate restTemplate;

    @Value("${app.services.patient-service-url}")
    private String patientServiceUrl;

    /**
     * Fetches a patient by making a REST API call to the Patient Service.
     *
     * @param patientId The ID of the patient to retrieve.
     * @return An Optional containing the PatientDto if the service call is successful and the patient is found,
     *         otherwise an empty Optional.
     */
    @Override
    public Optional<PatientDto> getPatientById(String patientId) {
        String url = patientServiceUrl + "/api/v1/patients/" + patientId;
        try {
            PatientDto patient = restTemplate.getForObject(url, PatientDto.class);
            return Optional.ofNullable(patient);
        } catch (HttpClientErrorException.NotFound notFound) {
            log.warn("Patient not found with id: {}. The Patient Service returned 404.", patientId);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error calling Patient Service at url: {}. Error: {}", url, e.getMessage());
            // In a real-world scenario, you might want to re-throw a custom exception
            // or handle it based on business requirements (e.g., retry logic).
            return Optional.empty();
        }
    }
}