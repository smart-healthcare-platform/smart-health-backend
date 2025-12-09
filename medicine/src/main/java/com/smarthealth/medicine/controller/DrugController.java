package com.smarthealth.medicine.controller;

import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.service.DrugService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/drugs")
@RequiredArgsConstructor
public class DrugController {

    private final DrugService drugService;

    @GetMapping
    public ResponseEntity<List<Drug>> searchDrugs(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(drugService.searchDrugs(search));
    }
}