package fit.iuh.billing.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Feign Client để gọi Appointment Service.
 * Sử dụng để thông báo khi thanh toán phí khám thành công.
 */
@FeignClient(name = "appointment-service", url = "${appointment.service.url}")
public interface AppointmentServiceClient {

    /**
     * Xác nhận thanh toán phí khám cho appointment.
     * Appointment Service sẽ cập nhật status → CONFIRMED/PAID
     * 
     * @param appointmentId ID của lịch khám cần xác nhận thanh toán
     */
    @PostMapping("/api/v1/internal/appointments/{appointmentId}/confirm-payment")
    void confirmAppointmentPayment(@PathVariable("appointmentId") String appointmentId);
}
