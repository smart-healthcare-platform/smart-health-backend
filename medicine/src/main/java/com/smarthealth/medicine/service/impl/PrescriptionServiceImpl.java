package com.smarthealth.medicine.service.impl;

import com.smarthealth.medicine.domain.enums.PrescriptionStatus;
import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.domain.model.Prescription;
import com.smarthealth.medicine.domain.model.PrescriptionItem;
import com.smarthealth.medicine.domain.repository.DrugRepository;
import com.smarthealth.medicine.domain.repository.PrescriptionRepository;
import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.PrescriptionItemDto;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.service.PrescriptionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DrugRepository drugRepository;
    private final RestTemplate restTemplate;
    // TODO: Inject patient service URL from properties

    @Override
    @Transactional
    public PrescriptionResponse createPrescription(CreatePrescriptionRequest request) {
        // TODO: Call Patient Service to validate patientId
        // restTemplate.getForObject(patientServiceUrl + "/" + request.getPatientId(), String.class);

        Prescription prescription = new Prescription();
        prescription.setPatientId(request.getPatientId());
        prescription.setDoctorId(request.getDoctorId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setStatus(PrescriptionStatus.PENDING_PAYMENT);

        List<PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionItemDto itemDto : request.getItems()) {
            Drug drug = drugRepository.findById(itemDto.getDrugId())
                    .orElseThrow(() -> new EntityNotFoundException("Drug not found with id: " + itemDto.getDrugId()));

            PrescriptionItem item = new PrescriptionItem();
            item.setPrescription(prescription);
            item.setDrug(drug);
            item.setDosage(itemDto.getDosage());
            item.setFrequency(itemDto.getFrequency());
            item.setRoute(itemDto.getRoute());
            item.setTiming(itemDto.getTiming());
            item.setDurationDays(itemDto.getDurationDays());
            items.add(item);
        }
        prescription.setItems(items);

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // TODO: Send event to Notification Service

        return new PrescriptionResponse(savedPrescription.getId(), savedPrescription.getStatus());
    }
}