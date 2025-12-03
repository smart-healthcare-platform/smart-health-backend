package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.dto.BulkPaymentRequest;
import fit.iuh.billing.dto.ConfirmPaymentRequest;
import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.OutstandingPaymentResponse;
import fit.iuh.billing.dto.PaymentItemDto;
import fit.iuh.billing.dto.PaymentResponse;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.BillingService;
import fit.iuh.billing.services.PaymentGatewayFactory;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Override
    public Page<PaymentResponse> searchPayments(
            LocalDate startDate,
            LocalDate endDate,
            PaymentStatus status,
            PaymentMethodType paymentMethod,
            PaymentType paymentType,
            int page,
            int size
    ) {
        log.info("Searching payments with filters - startDate: {}, endDate: {}, status: {}, method: {}, type: {}",
                startDate, endDate, status, paymentMethod, paymentType);

        // Convert LocalDate to LocalDateTime for query
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        // Create pageable with sorting by createdAt descending
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Get all payments and filter manually (in production, use Specification or custom query)
        List<Payment> allPayments = paymentRepository.findAll();

        List<Payment> filteredPayments = allPayments.stream()
                .filter(payment -> {
                    // Filter by date range
                    if (startDateTime != null && payment.getCreatedAt().isBefore(startDateTime)) {
                        return false;
                    }
                    if (endDateTime != null && payment.getCreatedAt().isAfter(endDateTime)) {
                        return false;
                    }
                    // Filter by status
                    if (status != null && payment.getStatus() != status) {
                        return false;
                    }
                    // Filter by payment method
                    if (paymentMethod != null && payment.getPaymentMethod() != paymentMethod) {
                        return false;
                    }
                    // Filter by payment type
                    if (paymentType != null && payment.getPaymentType() != paymentType) {
                        return false;
                    }
                    return true;
                })
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .collect(Collectors.toList());

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, filteredPayments.size());
        List<Payment> pagedPayments = filteredPayments.subList(start, end);

        List<PaymentResponse> paymentResponses = pagedPayments.stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(
                paymentResponses,
                pageable,
                filteredPayments.size()
        );
    }

    @Override
    public List<PaymentResponse> getTodayPayments(PaymentStatus status) {
        log.info("🔍 [SERVICE] Fetching today's payments with status filter: {}", status);

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
        
        log.debug("   Date range: {} to {}", startOfDay, endOfDay);

        List<Payment> payments;
        
        if (status != null) {
            log.info("   Using status filter: {}", status);
            payments = paymentRepository.findByStatusAndDateRange(status, startOfDay, endOfDay);
            log.info("   Found {} payments with status {}", payments.size(), status);
        } else {
            log.info("   No status filter - fetching ALL payments created today");
            // Get all payments created today
            List<Payment> allPayments = paymentRepository.findByCreatedAtAfter(startOfDay);
            log.info("   Found {} payments created after {}", allPayments.size(), startOfDay);
            
            payments = allPayments.stream()
                    .filter(p -> p.getCreatedAt().isBefore(endOfDay) || p.getCreatedAt().isEqual(endOfDay))
                    .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                    .collect(Collectors.toList());
            
            log.info("   After filtering by end of day: {} payments", payments.size());
        }
        
        if (!payments.isEmpty()) {
            log.debug("   Payment entities: {}", payments);
            // Log each payment for debugging
            payments.forEach(p -> {
                log.debug("     - Payment {}: Type={}, Status={}, Amount={}, RefId={}, CreatedAt={}",
                    p.getPaymentCode(), p.getPaymentType(), p.getStatus(), 
                    p.getAmount(), p.getReferenceId(), p.getCreatedAt());
            });
        }

        List<PaymentResponse> responses = payments.stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
        
        log.info("✅ [SERVICE] Returning {} payment responses", responses.size());
        
        return responses;
    }

    @Override
    public PaymentResponse getByAppointmentId(String appointmentId) {
        log.info("Fetching payment for appointmentId: {}", appointmentId);

        // Try to find by referenceId with APPOINTMENT_FEE type
        List<Payment> payments = paymentRepository.findByReferenceIdAndPaymentType(
                appointmentId, 
                PaymentType.APPOINTMENT_FEE
        );

        if (payments.isEmpty()) {
            // Fallback: try to find by referenceId only
            Payment payment = paymentRepository.findByReferenceId(appointmentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found for appointment ID: " + appointmentId));
            return mapToPaymentResponse(payment);
        }

        // Return the most recent payment if multiple found
        Payment payment = payments.stream()
                .max((p1, p2) -> p1.getCreatedAt().compareTo(p2.getCreatedAt()))
                .orElseThrow(() -> new RuntimeException("Payment not found for appointment ID: " + appointmentId));

        return mapToPaymentResponse(payment);
    }

    @Override
    public PaymentResponse getByReferenceId(String referenceId, PaymentType paymentType) {
        log.info("Fetching payment for referenceId: {}, type: {}", referenceId, paymentType);

        if (paymentType != null) {
            List<Payment> payments = paymentRepository.findByReferenceIdAndPaymentType(referenceId, paymentType);
            
            if (payments.isEmpty()) {
                throw new RuntimeException("Payment not found for reference ID: " + referenceId + " and type: " + paymentType);
            }

            // Return the most recent payment
            Payment payment = payments.stream()
                    .max((p1, p2) -> p1.getCreatedAt().compareTo(p2.getCreatedAt()))
                    .orElseThrow(() -> new RuntimeException("Payment not found"));

            return mapToPaymentResponse(payment);
        } else {
            // Find by referenceId only
            Payment payment = paymentRepository.findByReferenceId(referenceId)
                    .orElseThrow(() -> new RuntimeException("Payment not found for reference ID: " + referenceId));
            
            return mapToPaymentResponse(payment);
        }
    }

    @Override
    public OutstandingPaymentResponse getOutstandingPayments(List<String> referenceIds) {
        log.info("Fetching outstanding payments for reference IDs: {}", referenceIds);

        if (referenceIds == null || referenceIds.isEmpty()) {
            throw new IllegalArgumentException("Reference IDs list cannot be empty");
        }

        // 1. Query tất cả payments theo referenceIds
        List<Payment> payments = paymentRepository.findByReferenceIdIn(referenceIds);

        if (payments.isEmpty()) {
            log.warn("No payments found for reference IDs: {}", referenceIds);
            return new OutstandingPaymentResponse(
                referenceIds.get(0), // Use first referenceId as appointmentId
                "",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                List.of()
            );
        }

        // 2. Tính tổng UNPAID (PENDING or PROCESSING status)
        BigDecimal totalUnpaid = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.PROCESSING)
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Tính tổng PAID (COMPLETED status)
        BigDecimal totalPaid = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Map sang PaymentItemDto
        List<PaymentItemDto> paymentItems = payments.stream()
            .map(this::mapToPaymentItemDto)
            .collect(Collectors.toList());

        log.info("Found {} payments, total unpaid: {}, total paid: {}", 
            payments.size(), totalUnpaid, totalPaid);

        return new OutstandingPaymentResponse(
            referenceIds.get(0), // Use first referenceId as appointmentId
            "", // Patient name will be filled by frontend
            totalUnpaid,
            totalPaid,
            paymentItems
        );
    }

    @Override
    @Transactional
    public void processBulkPayment(BulkPaymentRequest request) {
        log.info("Processing bulk payment for {} payments", request.getPaymentCodes().size());

        // 1. Lấy tất cả payments by codes
        List<Payment> payments = paymentRepository.findByPaymentCodeIn(request.getPaymentCodes());

        // Validate: Tất cả payments phải tồn tại
        if (payments.size() != request.getPaymentCodes().size()) {
            log.error("Some payment codes not found. Expected: {}, Found: {}", 
                request.getPaymentCodes().size(), payments.size());
            throw new IllegalArgumentException(
                String.format("Some payment codes not found. Expected %d, found %d",
                    request.getPaymentCodes().size(), payments.size())
            );
        }

        // 2. Validate tổng tiền khớp
        BigDecimal calculatedTotal = payments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (calculatedTotal.compareTo(request.getTotalAmount()) != 0) {
            log.error("Total amount mismatch. Expected: {}, Got: {}", 
                calculatedTotal, request.getTotalAmount());
            throw new IllegalArgumentException(
                String.format("Total amount mismatch: expected %s, got %s",
                    calculatedTotal, request.getTotalAmount())
            );
        }

        // 3. Validate: Tất cả payments đều chưa thanh toán
        boolean hasInvalidStatus = payments.stream()
            .anyMatch(p -> p.getStatus() == PaymentStatus.COMPLETED);

        if (hasInvalidStatus) {
            log.error("Some payments are already paid");
            throw new IllegalArgumentException("Some payments are already paid");
        }

        // 4. Update tất cả payments thành COMPLETED
        LocalDateTime now = LocalDateTime.now();
        payments.forEach(payment -> {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(now);
            payment.setPaymentMethod(request.getPaymentMethod());
            
            // Append notes to description
            if (request.getNotes() != null && !request.getNotes().isEmpty()) {
                String currentDesc = payment.getDescription() != null ? payment.getDescription() : "";
                payment.setDescription(
                    currentDesc.isEmpty() ? request.getNotes() : currentDesc + " | " + request.getNotes()
                );
            }
        });

        paymentRepository.saveAll(payments);
        log.info("Successfully updated {} payments to COMPLETED status", payments.size());

        // 5. Gọi Appointment Service để update appointment status (nếu có APPOINTMENT_FEE)
        payments.stream()
            .filter(p -> p.getPaymentType() == PaymentType.APPOINTMENT_FEE)
            .forEach(p -> {
                try {
                    log.info("Confirming payment for appointment: {}", p.getReferenceId());
                    ConfirmPaymentRequest confirmRequest = new ConfirmPaymentRequest(
                        p.getPaymentCode(),
                        p.getAmount()
                    );
                    appointmentServiceClient.confirmAppointmentPayment(
                        p.getReferenceId(),
                        confirmRequest
                    );
                } catch (Exception e) {
                    log.error("Failed to confirm payment for appointment {}: {}", 
                        p.getReferenceId(), e.getMessage());
                    // Don't throw - payment is already updated, just log the error
                }
            });
    }

    /**
     * Map Payment entity sang PaymentItemDto
     */
    private PaymentItemDto mapToPaymentItemDto(Payment payment) {
        return new PaymentItemDto(
            payment.getPaymentCode(),
            payment.getPaymentType(),
            payment.getAmount(),
            payment.getStatus(),
            payment.getDescription(),
            payment.getCreatedAt(),
            payment.getPaidAt()
        );
    }
}