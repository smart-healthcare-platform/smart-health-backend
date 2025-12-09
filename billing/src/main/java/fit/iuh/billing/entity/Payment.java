package fit.iuh.billing.entity;

import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String paymentCode;

    // Loại thanh toán: PHÍ KHÁM / XÉT NGHIỆM / THUỐC (nếu cần mở rộng sau)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    // Reference ID tương ứng với paymentType
    // - Nếu paymentType = APPOINTMENT_FEE → appointmentId
    // - Nếu paymentType = LAB_TEST → labTestId
    // - Nếu paymentType = PRESCRIPTION → prescriptionId (cho tương lai nếu bán thuốc)
    @Column(nullable = false)
    private String referenceId;

    // Appointment ID for grouping all payments related to an appointment
    // - For APPOINTMENT_FEE: appointmentId = referenceId
    // - For LAB_TEST: appointmentId links to the parent appointment
    // - For PRESCRIPTION: appointmentId links to the parent appointment
    // This field enables querying all payments (appointment fee + lab tests + prescriptions) for checkout
    @Column(name = "appointment_id", nullable = true)
    private String appointmentId;

    // DEPRECATED: Giữ lại để tương thích với code cũ, sẽ xóa sau
    @Deprecated
    @Column(name = "prescription_id")
    private String prescriptionId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType paymentMethod;

    @Column(length = 1024) // Tăng độ dài để chứa URL thanh toán
    private String paymentUrl;

    private String transactionId; // ID giao dịch từ cổng thanh toán

    @Column(length = 500)
    private String description; // Ghi chú, mô tả thanh toán

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    private LocalDateTime expiredAt;

    private LocalDateTime paidAt; // Thời gian thanh toán thành công

    // Composite Payment Support
    // Dùng cho thanh toán tổng hợp: một payment cha có thể chứa nhiều payment con
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_payment_id")
    private Payment parentPayment;

    @OneToMany(mappedBy = "parentPayment", cascade = CascadeType.ALL)
    private List<Payment> childPayments;

    // Metadata chứa thông tin chi tiết (JSON format)
    // VD: breakdown của composite payment, thông tin bổ sung
    @Column(columnDefinition = "TEXT")
    private String metadata;
}