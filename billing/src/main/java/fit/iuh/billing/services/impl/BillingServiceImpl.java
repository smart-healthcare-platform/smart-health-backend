package fit.iuh.billing.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.dto.BulkPaymentRequest;
import fit.iuh.billing.dto.BulkPaymentResponse;
import fit.iuh.billing.dto.CompositePaymentRequest;
import fit.iuh.billing.dto.CompositePaymentResponse;
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
import java.util.ArrayList;
import java.util.HashMap;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        // Validate payment type
        if (request.getPaymentType() == null) {
            throw new IllegalArgumentException("Payment type is required");
        }
        
        log.info("Creating payment - Type: {}, ReferenceId: {}, AppointmentId: {}, Amount: {}", 
            request.getPaymentType(), request.getReferenceId(), request.getAppointmentId(), request.getAmount());
        
        // ✅ CHECK DUPLICATE: APPOINTMENT_FEE must be unique per appointment
        if (request.getPaymentType() == PaymentType.APPOINTMENT_FEE) {
            String appointmentId = request.getAppointmentId() != null 
                ? request.getAppointmentId() 
                : request.getReferenceId();
            
            log.debug("Checking for existing APPOINTMENT_FEE payment for appointmentId: {}", appointmentId);
            
            // Find all payments for this appointment
            List<Payment> appointmentPayments = paymentRepository.findByAppointmentId(appointmentId);
            
            // Filter for APPOINTMENT_FEE type
            List<Payment> existingAppointmentFees = appointmentPayments.stream()
                .filter(p -> p.getPaymentType() == PaymentType.APPOINTMENT_FEE)
                .collect(Collectors.toList());
            
            if (!existingAppointmentFees.isEmpty()) {
                Payment existing = existingAppointmentFees.get(0);
                log.warn("APPOINTMENT_FEE payment already exists for appointmentId: {}. PaymentCode: {}, Status: {}", 
                    appointmentId, existing.getPaymentCode(), existing.getStatus());
                
                // If already COMPLETED → throw error
                if (existing.getStatus() == PaymentStatus.COMPLETED) {
                    throw new IllegalArgumentException(
                        String.format("APPOINTMENT_FEE already paid for appointment: %s. Payment code: %s", 
                            appointmentId, existing.getPaymentCode())
                    );
                }
                
                // If PENDING or PROCESSING → return existing payment
                if (existing.getStatus() == PaymentStatus.PENDING || 
                    existing.getStatus() == PaymentStatus.PROCESSING) {
                    log.info("Returning existing APPOINTMENT_FEE payment: {}", existing.getPaymentCode());
                    return mapToPaymentResponse(existing);
                }
                
                // If FAILED → allow creating new payment (fall through)
                log.info("Previous payment FAILED, allowing new payment creation");
            }
        }
        // ✅ CHECK DUPLICATE: LAB_TEST/PRESCRIPTION by referenceId + paymentType
        else if (request.getPaymentType() == PaymentType.LAB_TEST || 
                 request.getPaymentType() == PaymentType.PRESCRIPTION) {
            log.debug("Checking for existing {} payment for referenceId: {}", 
                request.getPaymentType(), request.getReferenceId());
            
            List<Payment> existingPayments = paymentRepository.findByReferenceIdAndPaymentType(
                request.getReferenceId(), 
                request.getPaymentType()
            );
            
            if (!existingPayments.isEmpty()) {
                Payment existing = existingPayments.get(0);
                log.warn("{} payment already exists for referenceId: {}. PaymentCode: {}, Status: {}", 
                    request.getPaymentType(), request.getReferenceId(), 
                    existing.getPaymentCode(), existing.getStatus());
                
                // If already COMPLETED → throw error
                if (existing.getStatus() == PaymentStatus.COMPLETED) {
                    throw new IllegalArgumentException(
                        String.format("%s already paid for reference: %s. Payment code: %s", 
                            request.getPaymentType(), request.getReferenceId(), existing.getPaymentCode())
                    );
                }
                
                // If PENDING or PROCESSING → return existing payment
                if (existing.getStatus() == PaymentStatus.PENDING || 
                    existing.getStatus() == PaymentStatus.PROCESSING) {
                    log.info("Returning existing {} payment: {}", request.getPaymentType(), existing.getPaymentCode());
                    return mapToPaymentResponse(existing);
                }
                
                // If FAILED → allow creating new payment (fall through)
                log.info("Previous payment FAILED, allowing new payment creation");
            }
        }
        
        log.info("No existing payment found or previous payment failed, creating new payment...");
        
        // Tạo Payment entity MỚI
        Payment payment = new Payment();
        payment.setPaymentCode(UUID.randomUUID().toString()); // Mã thanh toán duy nhất
        
        // Set new fields
        payment.setPaymentType(request.getPaymentType());
        payment.setReferenceId(request.getReferenceId());
        
        // Set appointmentId for grouping payments
        // For APPOINTMENT_FEE: appointmentId = referenceId
        // For LAB_TEST/PRESCRIPTION: appointmentId from request (parent appointment)
        if (request.getAppointmentId() != null) {
            payment.setAppointmentId(request.getAppointmentId());
        } else if (request.getPaymentType().equals(fit.iuh.billing.enums.PaymentType.APPOINTMENT_FEE)) {
            payment.setAppointmentId(request.getReferenceId());
        }
        
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
        response.setAppointmentId(payment.getAppointmentId()); // For grouping payments
        
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
        
        log.info("Validation passed, checking for existing payment...");

        // ✅ CHECK: Payment đã tồn tại chưa?
        List<Payment> existingPayments = paymentRepository.findByReferenceIdAndPaymentType(
            request.getReferenceId(), 
            request.getPaymentType()
        );
        
        if (!existingPayments.isEmpty()) {
            Payment existing = existingPayments.get(0);
            log.info("Found existing payment: code={}, status={}", existing.getPaymentCode(), existing.getStatus());
            
            // Nếu đã thanh toán → throw error
            if (existing.getStatus() == PaymentStatus.COMPLETED) {
                log.error("Payment already completed for {} with referenceId: {}", 
                    request.getPaymentType(), request.getReferenceId());
                throw new IllegalArgumentException(
                    String.format("Payment already completed for %s: %s. Payment code: %s", 
                        request.getPaymentType(), 
                        request.getReferenceId(),
                        existing.getPaymentCode())
                );
            }
            
            // Nếu đang pending/processing → update thành COMPLETED
            if (existing.getStatus() == PaymentStatus.PENDING || 
                existing.getStatus() == PaymentStatus.PROCESSING) {
                log.info("Updating existing payment from {} to COMPLETED", existing.getStatus());
                existing.setStatus(PaymentStatus.COMPLETED);
                existing.setPaidAt(LocalDateTime.now());
                existing.setPaymentMethod(PaymentMethodType.CASH);
                
                // Update notes
                if (request.getNotes() != null) {
                    String currentDesc = existing.getDescription() != null ? existing.getDescription() : "";
                    existing.setDescription(
                        currentDesc.isEmpty() 
                            ? request.getNotes() + " | Collected by: " + receptionistId
                            : currentDesc + " | " + request.getNotes() + " | Collected by: " + receptionistId
                    );
                } else {
                    String currentDesc = existing.getDescription() != null ? existing.getDescription() : "";
                    existing.setDescription(
                        currentDesc.isEmpty() 
                            ? "Cash payment collected by receptionist: " + receptionistId
                            : currentDesc + " | Cash payment collected by receptionist: " + receptionistId
                    );
                }
                
                existing = paymentRepository.save(existing);
                log.info("Successfully updated existing payment to COMPLETED");
                
                // Thông báo cho service liên quan
                notifyRelatedServiceForCashPayment(existing);
                
                return mapToPaymentResponse(existing);
            }
        }
        
        log.info("No existing payment found, creating new payment entity...");

        // Tạo Payment entity MỚI
        Payment payment = new Payment();
        payment.setPaymentCode("CASH-" + UUID.randomUUID().toString());
        payment.setPaymentType(request.getPaymentType());
        payment.setReferenceId(request.getReferenceId());
        payment.setAmount(BigDecimal.valueOf(request.getAmount())); // Convert Double to BigDecimal
        payment.setPaymentMethod(fit.iuh.billing.enums.PaymentMethodType.CASH);
        payment.setStatus(PaymentStatus.COMPLETED); // Thanh toán tiền mặt hoàn thành ngay
        payment.setCreatedAt(LocalDateTime.now());
        payment.setPaidAt(LocalDateTime.now()); // Set thời gian thanh toán
        
        // Set appointmentId for grouping payments
        // For APPOINTMENT_FEE: appointmentId = referenceId
        // For LAB_TEST/PRESCRIPTION: appointmentId from request (parent appointment)
        if (request.getAppointmentId() != null) {
            payment.setAppointmentId(request.getAppointmentId());
        } else if (request.getPaymentType().equals(fit.iuh.billing.enums.PaymentType.APPOINTMENT_FEE)) {
            payment.setAppointmentId(request.getReferenceId());
        }
        
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

        // 1. Query tất cả payments theo appointmentId
        // This will include appointment fee + lab tests + prescriptions for the appointment
        String appointmentId = referenceIds.get(0);
        List<Payment> payments = paymentRepository.findByAppointmentId(appointmentId);
        
        log.info("Found {} payments for appointmentId: {}", payments.size(), appointmentId);

        if (payments.isEmpty()) {
            log.warn("No payments found for appointmentId: {}", appointmentId);
            return new OutstandingPaymentResponse(
                appointmentId,
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

        log.info("Found {} payments for appointmentId {}, total unpaid: {}, total paid: {}", 
            payments.size(), appointmentId, totalUnpaid, totalPaid);

        return new OutstandingPaymentResponse(
            appointmentId,
            "", // Patient name will be filled by frontend
            totalUnpaid,
            totalPaid,
            paymentItems
        );
    }

    @Override
    @Transactional
    public BulkPaymentResponse processBulkPayment(BulkPaymentRequest request) {
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

        // Validate: Không được bulk pay các online payments (MOMO, VNPAY)
        List<String> onlinePaymentCodes = payments.stream()
            .filter(p -> p.getPaymentMethod() == PaymentMethodType.MOMO || 
                         p.getPaymentMethod() == PaymentMethodType.VNPAY)
            .map(Payment::getPaymentCode)
            .collect(Collectors.toList());
        
        if (!onlinePaymentCodes.isEmpty()) {
            log.error("Cannot process bulk payment for online payments: {}", onlinePaymentCodes);
            throw new IllegalArgumentException(
                String.format("Cannot process bulk payment for online payments: %s. " +
                    "These payments must be completed online or cancelled first.",
                    String.join(", ", onlinePaymentCodes))
            );
        }

        // 2. Phân loại payments: chưa thanh toán vs đã thanh toán
        List<Payment> unpaidPayments = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.PROCESSING)
            .collect(Collectors.toList());
        
        List<Payment> alreadyPaidPayments = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
            .collect(Collectors.toList());

        log.info("Found {} unpaid payments and {} already paid payments", 
            unpaidPayments.size(), alreadyPaidPayments.size());

        // 3. Validate: Phải có ít nhất 1 payment chưa thanh toán
        if (unpaidPayments.isEmpty()) {
            log.warn("All {} payments are already completed", payments.size());
            
            BigDecimal alreadyPaidAmount = alreadyPaidPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            return BulkPaymentResponse.builder()
                .totalRequested(request.getPaymentCodes().size())
                .successfullyProcessed(0)
                .alreadyCompleted(alreadyPaidPayments.size())
                .amountProcessed(BigDecimal.ZERO)
                .amountAlreadyPaid(alreadyPaidAmount)
                .message("All payments are already completed. No action needed.")
                .processedPaymentCodes(List.of())
                .skippedPaymentCodes(alreadyPaidPayments.stream()
                    .map(Payment::getPaymentCode)
                    .collect(Collectors.toList()))
                .paymentMethod(request.getPaymentMethod().toString())
                .build();
        }

        // 4. Tính tổng tiền cần thanh toán (chỉ unpaid)
        BigDecimal unpaidTotal = unpaidPayments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal alreadyPaidTotal = alreadyPaidPayments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Unpaid amount: {}, Already paid amount: {}, Total requested: {}", 
            unpaidTotal, alreadyPaidTotal, request.getTotalAmount());

        // 5. Validate tổng tiền: chỉ cần khớp với tổng của TẤT CẢ payments (để frontend gửi đúng)
        BigDecimal grandTotal = unpaidTotal.add(alreadyPaidTotal);
        if (grandTotal.compareTo(request.getTotalAmount()) != 0) {
            log.error("Total amount mismatch. Expected: {}, Got: {}", 
                grandTotal, request.getTotalAmount());
            throw new IllegalArgumentException(
                String.format("Total amount mismatch: expected %s, got %s",
                    grandTotal, request.getTotalAmount())
            );
        }

        // 6. Update chỉ unpaid payments thành COMPLETED
        LocalDateTime now = LocalDateTime.now();
        unpaidPayments.forEach(payment -> {
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

        paymentRepository.saveAll(unpaidPayments);
        log.info("Successfully updated {} payments to COMPLETED status", unpaidPayments.size());

        // 7. Gọi Appointment Service để update appointment status (nếu có APPOINTMENT_FEE)
        unpaidPayments.stream()
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

        // 8. Build response
        String message;
        if (alreadyPaidPayments.isEmpty()) {
            message = String.format("Successfully processed %d payment(s)", unpaidPayments.size());
        } else {
            message = String.format("Successfully processed %d payment(s). %d payment(s) were already completed and skipped.", 
                unpaidPayments.size(), alreadyPaidPayments.size());
        }

        return BulkPaymentResponse.builder()
            .totalRequested(request.getPaymentCodes().size())
            .successfullyProcessed(unpaidPayments.size())
            .alreadyCompleted(alreadyPaidPayments.size())
            .amountProcessed(unpaidTotal)
            .amountAlreadyPaid(alreadyPaidTotal)
            .message(message)
            .processedPaymentCodes(unpaidPayments.stream()
                .map(Payment::getPaymentCode)
                .collect(Collectors.toList()))
            .skippedPaymentCodes(alreadyPaidPayments.stream()
                .map(Payment::getPaymentCode)
                .collect(Collectors.toList()))
            .paymentMethod(request.getPaymentMethod().toString())
            .build();
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
            payment.getPaidAt(),
            payment.getPaymentMethod()
        );
    }

    @Override
    @Transactional
    public CompositePaymentResponse createCompositePayment(CompositePaymentRequest request) {
        log.info("Creating composite payment for appointment: {}, method: {}", 
                 request.getAppointmentId(), request.getPaymentMethod());

        // Validate payment method - chỉ hỗ trợ online payment
        if (request.getPaymentMethod() == PaymentMethodType.CASH) {
            throw new IllegalArgumentException("Composite payment only supports online payment methods (MOMO, VNPAY)");
        }

        // 1. Tìm tất cả payments chưa thanh toán liên quan đến appointment
        // Frontend gửi đầy đủ referenceIds (appointmentId + labTestOrderIds)
        List<String> referenceIds = request.getReferenceIds();
        
        if (referenceIds == null || referenceIds.isEmpty()) {
            throw new IllegalArgumentException("Reference IDs are required");
        }
        
        log.info("Searching for outstanding payments with referenceIds: {}", referenceIds);
        
        // Query outstanding payments với status PENDING hoặc PROCESSING và chưa có parent
        List<PaymentStatus> unpaidStatuses = List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING);
        List<Payment> outstandingPayments = paymentRepository.findOutstandingPaymentsForComposite(
            referenceIds, 
            unpaidStatuses
        );
        
        log.info("Found {} outstanding payments", outstandingPayments.size());

        if (outstandingPayments.isEmpty()) {
            throw new IllegalArgumentException("No outstanding payments found for appointment: " + request.getAppointmentId());
        }

        // 2. Tính tổng số tiền
        BigDecimal totalAmount = outstandingPayments.stream()
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Found {} outstanding payments, total amount: {}", outstandingPayments.size(), totalAmount);

        // 3. Tạo composite payment (payment cha)
        Payment compositePayment = new Payment();
        compositePayment.setPaymentCode("COMP-" + UUID.randomUUID().toString());
        compositePayment.setPaymentType(PaymentType.COMPOSITE_PAYMENT);
        compositePayment.setReferenceId(request.getAppointmentId());
        compositePayment.setAmount(totalAmount);
        compositePayment.setPaymentMethod(request.getPaymentMethod());
        compositePayment.setStatus(PaymentStatus.PENDING);
        compositePayment.setCreatedAt(LocalDateTime.now());
        compositePayment.setExpiredAt(LocalDateTime.now().plusMinutes(15));
        
        String description = request.getDescription() != null ? 
            request.getDescription() : 
            "Thanh toán tổng hợp cho appointment " + request.getAppointmentId();
        compositePayment.setDescription(description);

        // 4. Tạo metadata chứa breakdown
        List<Map<String, Object>> breakdownList = outstandingPayments.stream()
            .map(p -> {
                Map<String, Object> item = new HashMap<>();
                item.put("paymentId", p.getId());
                item.put("paymentCode", p.getPaymentCode());
                item.put("paymentType", p.getPaymentType().toString());
                item.put("referenceId", p.getReferenceId());
                item.put("amount", p.getAmount());
                item.put("description", p.getDescription());
                return item;
            })
            .collect(Collectors.toList());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("breakdown", breakdownList);
        metadata.put("itemCount", outstandingPayments.size());

        try {
            compositePayment.setMetadata(objectMapper.writeValueAsString(metadata));
        } catch (JsonProcessingException e) {
            log.error("Error serializing metadata", e);
            compositePayment.setMetadata("{}");
        }

        // 5. Lưu composite payment
        compositePayment = paymentRepository.save(compositePayment);
        log.info("Created composite payment: {}", compositePayment.getPaymentCode());

        // 6. Tạo payment URL từ gateway
        PaymentGatewayService gatewayService = paymentGatewayFactory.getGatewayService(request.getPaymentMethod());
        String paymentUrl = gatewayService.createPaymentUrl(compositePayment);
        compositePayment.setPaymentUrl(paymentUrl);
        compositePayment.setStatus(PaymentStatus.PROCESSING);
        compositePayment = paymentRepository.save(compositePayment);

        // 7. Link các child payments với composite payment
        Payment finalCompositePayment = compositePayment;
        outstandingPayments.forEach(childPayment -> {
            childPayment.setParentPayment(finalCompositePayment);
            childPayment.setStatus(PaymentStatus.PROCESSING); // Đồng bộ status
        });
        paymentRepository.saveAll(outstandingPayments);

        log.info("Linked {} child payments to composite payment", outstandingPayments.size());

        // 8. Build response
        List<CompositePaymentResponse.PaymentBreakdownItem> breakdownItems = outstandingPayments.stream()
            .map(p -> CompositePaymentResponse.PaymentBreakdownItem.builder()
                .paymentId(p.getId())
                .paymentCode(p.getPaymentCode())
                .paymentType(p.getPaymentType().toString())
                .referenceId(p.getReferenceId())
                .amount(p.getAmount())
                .description(p.getDescription())
                .build())
            .collect(Collectors.toList());

        return CompositePaymentResponse.builder()
            .paymentId(compositePayment.getId())
            .paymentCode(compositePayment.getPaymentCode())
            .paymentUrl(paymentUrl)
            .totalAmount(totalAmount)
            .paymentMethod(request.getPaymentMethod().toString())
            .breakdown(breakdownItems)
            .expiredAt(compositePayment.getExpiredAt().toString())
            .build();
    }

    @Override
    @Transactional
    public PaymentResponse cancelPayment(String paymentCode) {
        log.info("Cancelling payment with code: {}", paymentCode);

        // 1. Tìm payment theo paymentCode
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
            .orElseThrow(() -> {
                log.error("Payment not found with code: {}", paymentCode);
                return new IllegalArgumentException("Payment not found: " + paymentCode);
            });

        // 2. Validate: chỉ có thể cancel payment ở trạng thái PENDING hoặc PROCESSING
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING) {
            log.error("Cannot cancel payment {} with status: {}", paymentCode, payment.getStatus());
            throw new IllegalArgumentException(
                String.format("Cannot cancel payment with status %s. Only PENDING or PROCESSING payments can be cancelled.",
                    payment.getStatus())
            );
        }

        // 3. Validate: không cancel payment đã có parent (composite payment child)
        if (payment.getParentPayment() != null) {
            log.error("Cannot cancel child payment {} that belongs to composite payment", paymentCode);
            throw new IllegalArgumentException(
                "Cannot cancel a child payment that belongs to a composite payment. Cancel the parent payment instead."
            );
        }

        // 4. Update status to CANCELLED
        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setUpdatedAt(LocalDateTime.now());
        
        // Append cancellation note to description
        String cancelNote = " | Cancelled at " + LocalDateTime.now();
        String currentDesc = payment.getDescription() != null ? payment.getDescription() : "";
        payment.setDescription(currentDesc + cancelNote);

        paymentRepository.save(payment);
        log.info("Successfully cancelled payment: {}", paymentCode);

        // 5. Nếu là composite payment (parent), cần cancel tất cả child payments
        if (payment.getPaymentType() == PaymentType.APPOINTMENT_FEE && payment.getReferenceId() != null) {
            List<Payment> childPayments = paymentRepository.findByParentPaymentId(payment.getId());
            if (!childPayments.isEmpty()) {
                log.info("Cancelling {} child payments of composite payment {}", childPayments.size(), paymentCode);
                childPayments.forEach(child -> {
                    child.setStatus(PaymentStatus.CANCELLED);
                    child.setUpdatedAt(LocalDateTime.now());
                    String childCancelNote = " | Cancelled (parent cancelled) at " + LocalDateTime.now();
                    String childDesc = child.getDescription() != null ? child.getDescription() : "";
                    child.setDescription(childDesc + childCancelNote);
                });
                paymentRepository.saveAll(childPayments);
                log.info("Successfully cancelled all child payments");
            }
        }

        return mapToPaymentResponse(payment);
    }
}