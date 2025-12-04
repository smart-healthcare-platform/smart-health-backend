package fit.iuh.billing.dto;

import fit.iuh.billing.enums.PaymentMethodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho việc tạo thanh toán tổng hợp (composite payment)
 * Dùng khi receptionist muốn tạo một URL thanh toán duy nhất cho tất cả các khoản phí
 * của một appointment (phí khám + xét nghiệm)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompositePaymentRequest {

    /**
     * ID của appointment cần thanh toán
     * Dùng để tracking và reference
     */
    @NotBlank(message = "Appointment ID is required")
    private String appointmentId;

    /**
     * Danh sách reference IDs cần thanh toán
     * Bao gồm: appointmentId + labTestOrderIds
     * Frontend phải gửi đầy đủ list này
     */
    @NotEmpty(message = "Reference IDs are required")
    private List<String> referenceIds;

    /**
     * Phương thức thanh toán (MOMO, VNPAY)
     * Composite payment chỉ áp dụng cho thanh toán online
     */
    @NotNull(message = "Payment method is required")
    private PaymentMethodType paymentMethod;

    /**
     * Mô tả cho thanh toán (optional)
     */
    private String description;
}