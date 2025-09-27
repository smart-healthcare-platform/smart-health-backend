package com.smarthealth.medicine.domain.model;

import com.smarthealth.medicine.domain.enums.StockStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Drug {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String activeIngredient;

    private String strength;

    @Enumerated(EnumType.STRING)
    private StockStatus stockStatus;
}