package fit.iuh.billing.services.impl;

import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.PaymentResponse;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.BillingService;
import fit.iuh.billing.services.PaymentGatewayFactory;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;

    @Override
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        // Tạo Payment entity
        Payment payment = new Payment();
        payment.setPaymentCode(UUID.randomUUID().toString()); // Mã thanh toán duy nhất
        payment.setPrescriptionId(request.getPrescriptionId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        // Có thể thêm expiredAt nếu cần

        payment = paymentRepository.save(payment);

        // Lấy PaymentGatewayService phù hợp
        PaymentGatewayService gatewayService = paymentGatewayFactory.getGatewayService(request.getPaymentMethod());

        // Tạo URL thanh toán
        String paymentUrl = gatewayService.createPaymentUrl(payment);
        payment.setPaymentUrl(paymentUrl);
        payment.setStatus(PaymentStatus.PROCESSING); // Chuyển trạng thái sang PROCESSING
        paymentRepository.save(payment);

        return mapToPaymentResponse(payment);
    }

    @Override
    public void processIpn(String gateway, Map<String, String> ipnData) {
        try {
            PaymentGatewayService gatewayService = paymentGatewayFactory.getGatewayService(mapGatewayStringToEnum(gateway));
            gatewayService.processIpn(ipnData);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Unsupported gateway for IPN: " + gateway, e);
        } catch (Exception e) {
            throw new RuntimeException("Error processing IPN for gateway " + gateway + ": " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + id));
        return mapToPaymentResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByPrescriptionId(String prescriptionId) {
        Payment payment = paymentRepository.findByPrescriptionId(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for prescription ID: " + prescriptionId));
        return mapToPaymentResponse(payment);
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentCode(),
                payment.getPrescriptionId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaymentMethod(),
                payment.getPaymentUrl(),
                payment.getCreatedAt(),
                payment.getExpiredAt()
        );
    }

    private fit.iuh.billing.enums.PaymentMethodType mapGatewayStringToEnum(String gateway) {
        return switch (gateway.toLowerCase()) {
            case "momo" -> fit.iuh.billing.enums.PaymentMethodType.MOMO;
            case "vnpay" -> fit.iuh.billing.enums.PaymentMethodType.VNPAY;
            case "cod" -> fit.iuh.billing.enums.PaymentMethodType.COD;
            default -> throw new IllegalArgumentException("Unknown payment gateway: " + gateway);
        };
    }
}