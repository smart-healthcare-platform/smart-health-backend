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

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    private LocalDateTime expiredAt;
}