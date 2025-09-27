package com.smarthealth.medicine.service.impl;

import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.domain.repository.DrugRepository;
import com.smarthealth.medicine.service.DrugService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DrugServiceImpl implements DrugService {

    private final DrugRepository drugRepository;

    @Override
    public List<Drug> searchDrugs(String query) {
        if (query == null || query.isBlank()) {
            return drugRepository.findAll();
        }
        return drugRepository.searchDrugs(query);
    }
}