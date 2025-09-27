package com.smarthealth.medicine.domain.repository;

import com.smarthealth.medicine.domain.model.Drug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DrugRepository extends JpaRepository<Drug, Long> {

    @Query("SELECT d FROM Drug d WHERE lower(d.name) LIKE lower(concat('%', :query, '%')) OR lower(d.activeIngredient) LIKE lower(concat('%', :query, '%'))")
    List<Drug> searchDrugs(String query);
}