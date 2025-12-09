package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service("codPaymentGatewayService") // Đặt tên bean rõ ràng
public class CODPaymentGatewayService implements PaymentGatewayService {

    private final PaymentRepository paymentRepository;
    
    @Autowired(required = false) // Optional dependency
    private AppointmentServiceClient appointmentServiceClient;

    public CODPaymentGatewayService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    public String createPaymentUrl(Payment payment) {
        // Đối với COD, không cần tạo URL chuyển hướng, thanh toán sẽ được xử lý offline
        // Chúng ta có thể cập nhật trạng thái ngay lập tức hoặc để PENDING và chờ xác nhận thủ công
        // Hiện tại, để đơn giản, chúng ta sẽ để ở PENDING và cần một cơ chế khác để COMPLETED
        
        String orderInfo = buildOrderInfo(payment);
        log.info("COD payment created: {}. No payment URL generated.", orderInfo);
        return null; // Không có URL chuyển hướng cho COD
    }

    @Override
    public void processIpn(Map<String, String> ipnData) {
        // Đối với COD, không có IPN tự động từ cổng thanh toán.
        // Việc xác nhận thanh toán COD sẽ được thực hiện thông qua một API nội bộ khác
        // hoặc bởi một người dùng/hệ thống nội bộ.
        // Log cảnh báo nếu có IPN đến cho COD (có thể là lỗi cấu hình)
        log.warn("Received unexpected IPN for COD payment. Data: {}", ipnData);
        throw new UnsupportedOperationException("COD payments do not support IPN callbacks.");
    }
    
    /**
     * Tạo order info description dựa trên loại thanh toán
     */
    private String buildOrderInfo(Payment payment) {
        if (payment.getPaymentType() == null) {
            return "COD payment for " + payment.getReferenceId();
        }
        
        switch (payment.getPaymentType()) {
            case APPOINTMENT_FEE:
                return "COD - Phi kham benh: " + payment.getReferenceId();
            case LAB_TEST:
                return "COD - Xet nghiem: " + payment.getReferenceId();
            case PRESCRIPTION:
                return "COD - Don thuoc: " + payment.getReferenceId();
            case OTHER:
            default:
                return "COD - Dich vu y te: " + payment.getReferenceId();
        }
    }
}