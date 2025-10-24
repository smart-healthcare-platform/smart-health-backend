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
        // Validate payment type
        if (request.getPaymentType() == null) {
            throw new IllegalArgumentException("Payment type is required");
        }
        
        // Tạo Payment entity
        Payment payment = new Payment();
        payment.setPaymentCode(UUID.randomUUID().toString()); // Mã thanh toán duy nhất
        
        // Set new fields
        payment.setPaymentType(request.getPaymentType());
        payment.setReferenceId(request.getReferenceId());
        
        // DEPRECATED: Set prescriptionId cho backward compatibility
        if (request.getPaymentType().equals(fit.iuh.billing.enums.PaymentType.PRESCRIPTION)) {
            payment.setPrescriptionId(request.getReferenceId());
        } else if (request.getPrescriptionId() != null) {
            // Fallback cho code cũ
            payment.setPrescriptionId(request.getPrescriptionId());
        }
        
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        // Có thể thêm expiredAt nếu cần (ví dụ: 15 phút)
        payment.setExpiredAt(LocalDateTime.now().plusMinutes(15));

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
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setPaymentCode(payment.getPaymentCode());
        
        // New fields
        response.setPaymentType(payment.getPaymentType());
        response.setReferenceId(payment.getReferenceId());
        
        // Deprecated field - giữ lại để tương thích
        response.setPrescriptionId(payment.getPrescriptionId());
        
        response.setAmount(payment.getAmount());
        response.setStatus(payment.getStatus());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentUrl(payment.getPaymentUrl());
        response.setCreatedAt(payment.getCreatedAt());
        response.setExpiredAt(payment.getExpiredAt());
        
        return response;
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