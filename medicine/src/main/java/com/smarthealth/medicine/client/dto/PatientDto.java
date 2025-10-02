package com.smarthealth.medicine.client.dto;

import java.util.List;

/**
 * Data Transfer Object for Patient information received from Patient Service.
 * Using a record for immutability and conciseness.
 *
 * @param id The unique identifier of the patient.
 * @param name The full name of the patient.
 * @param allergies A list of known allergies for the patient.
 */
public record PatientDto(
    Long id,
    String name,
    List<String> allergies
) {}