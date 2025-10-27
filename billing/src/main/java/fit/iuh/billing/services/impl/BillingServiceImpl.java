package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.dto.ConfirmPaymentRequest;
import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.PaymentResponse;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.BillingService;
import fit.iuh.billing.services.PaymentGatewayFactory;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingServiceImpl implements BillingService {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;
    private final AppointmentServiceClient appointmentServiceClient;

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
            case "cash", "cod" -> fit.iuh.billing.enums.PaymentMethodType.CASH;
            default -> throw new IllegalArgumentException("Unknown payment gateway: " + gateway);
        };
    }

    @Override
    public PaymentResponse createCashPayment(fit.iuh.billing.dto.CashPaymentRequest request, String receptionistId) {
        log.info("=== Creating cash payment ===");
        log.info("Request: referenceId={}, amount={}, paymentType={}, notes={}", 
            request.getReferenceId(), request.getAmount(), request.getPaymentType(), request.getNotes());
        log.info("ReceptionistId: {}", receptionistId);
        
        // Validate
        if (request.getReferenceId() == null || request.getReferenceId().isEmpty()) {
            log.error("Validation failed: Reference ID is required");
            throw new IllegalArgumentException("Reference ID is required");
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            log.error("Validation failed: Amount must be positive, got: {}", request.getAmount());
            throw new IllegalArgumentException("Amount must be positive");
        }
        if (request.getPaymentType() == null) {
            log.error("Validation failed: Payment type is required");
            throw new IllegalArgumentException("Payment type is required");
        }
        
        log.info("Validation passed, creating payment entity...");

        // Tạo Payment entity
        Payment payment = new Payment();
        payment.setPaymentCode("CASH-" + UUID.randomUUID().toString());
        payment.setPaymentType(request.getPaymentType());
        payment.setReferenceId(request.getReferenceId());
        payment.setAmount(BigDecimal.valueOf(request.getAmount())); // Convert Double to BigDecimal
        payment.setPaymentMethod(fit.iuh.billing.enums.PaymentMethodType.CASH);
        payment.setStatus(PaymentStatus.COMPLETED); // Thanh toán tiền mặt hoàn thành ngay
        payment.setCreatedAt(LocalDateTime.now());
        payment.setPaidAt(LocalDateTime.now()); // Set thời gian thanh toán
        
        // Lưu thông tin người thu tiền (có thể thêm field receptionistId vào entity sau)
        if (request.getNotes() != null) {
            payment.setDescription(request.getNotes() + " | Collected by: " + receptionistId);
        } else {
            payment.setDescription("Cash payment collected by receptionist: " + receptionistId);
        }

        payment = paymentRepository.save(payment);

        // Thông báo cho service liên quan (Appointment Service)
        notifyRelatedServiceForCashPayment(payment);

        return mapToPaymentResponse(payment);
    }

    /**
     * Thông báo cho service liên quan khi thanh toán tiền mặt thành công
     */
    private void notifyRelatedServiceForCashPayment(Payment payment) {
        if (payment.getPaymentType() == null) {
            log.warn("Payment {} has no paymentType, skipping service notification", payment.getPaymentCode());
            return;
        }

        try {
            switch (payment.getPaymentType()) {
                case APPOINTMENT_FEE:
                    if (appointmentServiceClient != null) {
                        log.info("Notifying Appointment Service for cash payment {}", payment.getPaymentCode());
                        
                        ConfirmPaymentRequest request = ConfirmPaymentRequest.builder()
                                .paymentId(String.valueOf(payment.getId()))
                                .amount(payment.getAmount())
                                .build();
                        
                        appointmentServiceClient.confirmAppointmentPayment(payment.getReferenceId(), request);
                        log.info("Successfully notified Appointment Service: appointmentId={}, paymentId={}, amount={}", 
                            payment.getReferenceId(), payment.getId(), payment.getAmount());
                    } else {
                        log.warn("AppointmentServiceClient not available, skipping notification");
                    }
                    break;
                    
                case LAB_TEST:
                    log.info("Lab test cash payment confirmed: {}", payment.getReferenceId());
                    break;
                    
                default:
                    log.info("Payment type {} completed for {}", payment.getPaymentType(), payment.getReferenceId());
                    break;
            }
        } catch (Exception e) {
            log.error("Error notifying related service for cash payment {}: {}", 
                payment.getPaymentCode(), e.getMessage());
        }
    }
}