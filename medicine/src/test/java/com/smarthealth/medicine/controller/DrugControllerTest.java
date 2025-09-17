package com.smarthealth.medicine.controller;

import com.smarthealth.medicine.domain.model.Drug;
import com.smarthealth.medicine.service.DrugService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(DrugController.class)
public class DrugControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DrugService drugService;

    @Test
    void whenSearchDrugs_withValidQuery_shouldReturnOk() throws Exception {
        Drug drug = new Drug();
        drug.setName("Aspirin");
        when(drugService.searchDrugs(anyString())).thenReturn(Collections.singletonList(drug));

        mockMvc.perform(get("/api/v1/drugs").param("search", "aspirin"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void whenSearchDrugs_withNoQuery_shouldReturnOk() throws Exception {
        Drug drug = new Drug();
        drug.setName("Aspirin");
        when(drugService.searchDrugs(null)).thenReturn(Collections.singletonList(drug));

        mockMvc.perform(get("/api/v1/drugs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}