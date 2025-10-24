package fit.iuh.billing.repository;

import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
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
     * Tìm một thanh toán dựa trên reference ID (appointmentId, labTestId, etc.)
     * @param referenceId ID tham chiếu.
     * @return Optional chứa Payment nếu tìm thấy.
     */
    Optional<Payment> findByReferenceId(String referenceId);
    
    /**
     * Tìm tất cả payments dựa trên reference ID và payment type
     * @param referenceId ID tham chiếu
     * @param paymentType Loại thanh toán
     * @return Danh sách payments
     */
    List<Payment> findByReferenceIdAndPaymentType(String referenceId, PaymentType paymentType);

    /**
     * Tìm một thanh toán dựa trên ID của đơn thuốc.
     * @deprecated Sử dụng findByReferenceId() thay thế
     * @param prescriptionId ID của đơn thuốc.
     * @return Optional chứa Payment nếu tìm thấy.
     */
    @Deprecated
    Optional<Payment> findByPrescriptionId(String prescriptionId);
}