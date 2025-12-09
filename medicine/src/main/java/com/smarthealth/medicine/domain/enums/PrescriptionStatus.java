package com.smarthealth.medicine.domain.enums;

/**
 * Trạng thái đơn thuốc trong hệ thống
 * 
 * LƯU Ý: Hệ thống KHÔNG bán thuốc trực tiếp cho bệnh nhân.
 * Đơn thuốc chỉ được in ra để bệnh nhân tự mua tại nhà thuốc liên kết.
 */
public enum PrescriptionStatus {
    /**
     * Đơn thuốc đang được bác sĩ soạn (chưa hoàn tất khám)
     * Chuyển sang ACTIVE khi bác sĩ hoàn tất khám bệnh
     */
    DRAFT,
    
    /**
     * Đơn thuốc đã được tạo và có hiệu lực
     * Bệnh nhân có thể lấy đơn tại quầy lễ tân
     */
    ACTIVE,
    
    /**
     * Đơn thuốc đã được in và trao cho bệnh nhân
     * Cho phép in lại nếu bệnh nhân mất đơn
     */
    PRINTED,
    
    /**
     * Đơn thuốc đã bị hủy
     * Có thể do bác sĩ hủy hoặc bệnh nhân không muốn lấy đơn
     */
    CANCELLED
}