package fit.iuh.billing.repository;

import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
     * Tìm payments theo danh sách payment codes
     * Dùng cho bulk payment processing
     * @param paymentCodes Danh sách payment codes
     * @return Danh sách payments
     */
    List<Payment> findByPaymentCodeIn(List<String> paymentCodes);

    /**
     * Tìm payments theo danh sách reference IDs
     * Dùng cho outstanding payments query
     * @param referenceIds Danh sách reference IDs
     * @return Danh sách payments
     */
    List<Payment> findByReferenceIdIn(List<String> referenceIds);

    /**
     * Tìm một thanh toán dựa trên ID của đơn thuốc.
     * @deprecated Sử dụng findByReferenceId() thay thế
     * @param prescriptionId ID của đơn thuốc.
     * @return Optional chứa Payment nếu tìm thấy.
     */
    @Deprecated
    Optional<Payment> findByPrescriptionId(String prescriptionId);
    
    // ===== Admin Statistics Queries =====
    
    /**
     * Count total payments
     */
    long count();
    
    /**
     * Count payments by status
     */
    long countByStatus(PaymentStatus status);
    
    /**
     * Count payments by payment method
     */
    long countByPaymentMethod(PaymentMethodType paymentMethod);
    
    /**
     * Count payments by payment type
     */
    long countByPaymentType(PaymentType paymentType);
    
    /**
     * Get total revenue (sum of completed payments)
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);
    
    /**
     * Get total revenue by payment method
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentMethod = :method AND p.status = 'COMPLETED'")
    BigDecimal sumAmountByPaymentMethod(@Param("method") PaymentMethodType method);
    
    /**
     * Get total revenue by payment type
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = :type AND p.status = 'COMPLETED'")
    BigDecimal sumAmountByPaymentType(@Param("type") PaymentType type);
    
    /**
     * Get revenue within date range
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Count payments within date range
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    long countByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get average payment amount for completed payments
     */
    @Query("SELECT COALESCE(AVG(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal getAveragePaymentAmount();
    
    /**
     * Find all completed payments within date range
     */
    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate ORDER BY p.paidAt DESC")
    List<Payment> findCompletedPaymentsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find all payments by status within date range
     */
    @Query("SELECT p FROM Payment p WHERE p.status = :status AND p.createdAt BETWEEN :startDate AND :endDate ORDER BY p.createdAt DESC")
    List<Payment> findByStatusAndDateRange(@Param("status") PaymentStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Get payment count by method and status
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentMethod = :method AND p.status = :status")
    long countByPaymentMethodAndStatus(@Param("method") PaymentMethodType method, @Param("status") PaymentStatus status);
    
    /**
     * Get all payments by payment method
     */
    List<Payment> findByPaymentMethod(PaymentMethodType paymentMethod);
    
    /**
     * Get all payments by status
     */
    List<Payment> findByStatus(PaymentStatus status);
    
    /**
     * Find payments created after a certain date
     */
    List<Payment> findByCreatedAtAfter(LocalDateTime date);
    
    /**
     * Find completed payments after a certain date
     */
    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt >= :date ORDER BY p.paidAt DESC")
    List<Payment> findCompletedPaymentsAfter(@Param("date") LocalDateTime date);
}