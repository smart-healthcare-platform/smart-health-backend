package com.smarthealth.medicine.service;

import com.smarthealth.medicine.domain.model.Drug;

import java.util.List;

public interface DrugService {
    List<Drug> searchDrugs(String query);
}