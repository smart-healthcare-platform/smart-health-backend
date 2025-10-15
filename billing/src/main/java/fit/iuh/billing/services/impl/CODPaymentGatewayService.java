package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.MedicineServiceClient;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service("codPaymentGatewayService") // Đặt tên bean rõ ràng
@RequiredArgsConstructor
public class CODPaymentGatewayService implements PaymentGatewayService {

    private final PaymentRepository paymentRepository;
    private final MedicineServiceClient medicineServiceClient; // Client gọi Medicine Service

    @Override
    public String createPaymentUrl(Payment payment) {
        // Đối với COD, không cần tạo URL chuyển hướng, thanh toán sẽ được xử lý offline
        // Chúng ta có thể cập nhật trạng thái ngay lập tức hoặc để PENDING và chờ xác nhận thủ công
        // Hiện tại, để đơn giản, chúng ta sẽ để ở PENDING và cần một cơ chế khác để COMPLETED
        log.info("COD payment created for prescription ID: {}. No payment URL generated.", payment.getPrescriptionId());
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
}