package fit.iuh.billing.repository;

import fit.iuh.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Tìm một thanh toán dựa trên mã thanh toán duy nhất.
     * @param paymentCode Mã thanh toán.
     * @return Optional chứa Payment nếu tìm thấy.
     */
    Optional<Payment> findByPaymentCode(String paymentCode);

    /**
     * Tìm một thanh toán dựa trên ID của đơn thuốc.
     * @param prescriptionId ID của đơn thuốc.
     * @return Optional chứa Payment nếu tìm thấy.
     */
    Optional<Payment> findByPrescriptionId(String prescriptionId);
}