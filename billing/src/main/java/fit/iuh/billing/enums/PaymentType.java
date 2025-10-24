package fit.iuh.billing.enums;

public enum PaymentType {
    /**
     * Thanh toán phí khám bệnh
     * Tạo trước khi khám, liên kết với Appointment
     */
    APPOINTMENT_FEE,

    /**
     * Thanh toán xét nghiệm
     * Tạo sau khi bác sĩ chỉ định, liên kết với LabTest
     */
    LAB_TEST,

    /**
     * Thanh toán đơn thuốc (dự phòng cho tương lai)
     * Hiện tại KHÔNG sử dụng vì hệ thống không bán thuốc
     * Bác sĩ chỉ kê đơn (PDF), bệnh nhân tự mua ở hiệu thuốc
     */
    @Deprecated
    PRESCRIPTION,

    /**
     * Các khoản phí khác (phí dịch vụ, phí giường, v.v.)
     */
    OTHER
}
