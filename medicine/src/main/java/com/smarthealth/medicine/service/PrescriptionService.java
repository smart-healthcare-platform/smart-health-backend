package com.smarthealth.medicine.service;

import com.smarthealth.medicine.model.CreatePrescriptionRequest;
import com.smarthealth.medicine.model.DrugFrequencyDto;
import com.smarthealth.medicine.model.MedicationHistoryDto;
import com.smarthealth.medicine.model.PrescriptionDetailDto;
import com.smarthealth.medicine.model.PrescriptionResponse;
import com.smarthealth.medicine.model.PrescriptionSummaryDto;

import java.util.List;

public interface PrescriptionService {

    PrescriptionResponse createPrescription(CreatePrescriptionRequest request);

    PrescriptionDetailDto getPrescriptionById(String id);

    PrescriptionDetailDto getPrescriptionByAppointmentId(String appointmentId);

    List<PrescriptionSummaryDto> getPrescriptionsByPatientId(String patientId);

    /**
     * Đánh dấu đơn thuốc đã được in
     * Cập nhật status từ ACTIVE/DRAFT -> PRINTED
     * Cho phép in lại nhiều lần (không thay đổi status nếu đã PRINTED)
     */
    void markAsPrinted(String prescriptionId);

    /**
     * Hủy đơn thuốc
     * Chỉ cho phép hủy đơn chưa in (status = ACTIVE hoặc DRAFT)
     */
    void cancelPrescription(String prescriptionId);

    /**
     * Lấy lịch sử dùng thuốc của bệnh nhân
     * @param patientId ID bệnh nhân
     * @param months Số tháng gần đây (null = tất cả)
     * @return Danh sách lịch sử dùng thuốc
     */
    List<MedicationHistoryDto> getPatientMedicationHistory(String patientId, Integer months);

    /**
     * Lấy tần suất sử dụng thuốc của bệnh nhân
     * @param patientId ID bệnh nhân
     * @return Danh sách thuốc và tần suất sử dụng
     */
    List<DrugFrequencyDto> getPatientDrugFrequency(String patientId);

}