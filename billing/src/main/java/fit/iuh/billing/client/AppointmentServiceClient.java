package fit.iuh.billing.client;

import fit.iuh.billing.dto.ConfirmPaymentRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

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
     * @param request Thông tin thanh toán (paymentId, amount)
     */
    @PostMapping("/api/v1/internal/appointments/{appointmentId}/confirm-payment")
    void confirmAppointmentPayment(
        @PathVariable("appointmentId") String appointmentId,
        @RequestBody ConfirmPaymentRequest request
    );
}
