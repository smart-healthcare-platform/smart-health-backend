package fit.iuh.billing.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Feign Client để gọi Medicine Service.
 * Sử dụng tên "medicine-service" để tích hợp với Eureka/Load Balancer.
 */
@FeignClient(name = "medicine-service", url = "${medicine.service.url}")
public interface MedicineServiceClient {

    /**
     * Gọi API nội bộ của Medicine Service để xác nhận thanh toán đơn thuốc.
     * @param prescriptionId ID của đơn thuốc cần xác nhận.
     */
    @PostMapping("/api/v1/internal/prescriptions/{prescriptionId}/confirm-payment")
    void confirmPrescriptionPayment(@PathVariable("prescriptionId") String prescriptionId);
}