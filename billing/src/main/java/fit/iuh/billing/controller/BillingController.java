package fit.iuh.billing.controller;

import fit.iuh.billing.dto.BulkPaymentRequest;
import fit.iuh.billing.dto.BulkPaymentResponse;
import fit.iuh.billing.dto.CompositePaymentRequest;
import fit.iuh.billing.dto.CompositePaymentResponse;
import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.OutstandingPaymentResponse;
import fit.iuh.billing.dto.PaymentResponse;
import fit.iuh.billing.services.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/billings")
@RequiredArgsConstructor
@Tag(name = "Billing API", description = "APIs for payment processing and management")
public class BillingController {

    private final BillingService billingService;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Operation(summary = "Create a new payment request", 
               description = "Creates a payment request and returns a payment URL. Supports multiple payment types: APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION, OTHER.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment request created successfully",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or unsupported payment method")
    })
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Parameter(description = "Payment request details with paymentType and referenceId", required = true)
            @Valid @RequestBody CreatePaymentRequest request) {
        log.info("Received request to create payment - Type: {}, ReferenceId: {}, Amount: {}", 
                 request.getPaymentType(), request.getReferenceId(), request.getAmount());
        PaymentResponse response = billingService.createPayment(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Handle Instant Payment Notification (IPN) from payment gateways", description = "Receives and processes IPN callbacks from various payment gateways.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "IPN processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid IPN data or unsupported gateway")
    })
    @PostMapping("/ipn/{gateway}")
    public ResponseEntity<Map<String, String>> processIpn(
            @Parameter(description = "Payment gateway identifier (e.g., 'momo', 'vnpay')", required = true)
            @PathVariable String gateway,
            @RequestBody Map<String, String> ipnData) {
        log.info("Received IPN for gateway {}. Data: {}", gateway, ipnData);
        try {
            billingService.processIpn(gateway, ipnData);
            Map<String, String> response = new HashMap<>();
            response.put("message", "IPN processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing IPN for gateway {}: {}", gateway, e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to process IPN: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @Operation(summary = "Handle return from payment gateway (for user redirection)", description = "Endpoint for user redirection after completing payment on gateway. Redirects to frontend payment success page.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "302", description = "Redirect to frontend payment success page"),
            @ApiResponse(responseCode = "302", description = "Redirect to frontend payment success page even on error")
    })
    @GetMapping("/return")
    public RedirectView handleReturnFromGateway(@RequestParam Map<String, String> params) {
        log.info("Received return from payment gateway. Params: {}", params);
        
        // FALLBACK: In test environment, MoMo sandbox may not send IPN
        // So we process the return params similar to IPN as a fallback
        try {
            // Determine gateway from params
            String gateway = "momo"; // Default to MoMo for now
            if (params.containsKey("vnp_TxnRef")) {
                gateway = "vnpay";
            }
            
            log.info("Processing return as fallback IPN for gateway: {}", gateway);
            billingService.processIpn(gateway, params);
        } catch (Exception e) {
            log.error("Error processing return from gateway: {}", e.getMessage());
            // Continue to redirect even on error - frontend will handle display
        }
        
        // Build redirect URL with all query parameters
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/payment/success");
        
        // Add all payment gateway parameters to the redirect URL
        params.forEach(builder::queryParam);
        
        String redirectUrl = builder.build().toUriString();
        log.info("Redirecting user to: {}", redirectUrl);
        
        return new RedirectView(redirectUrl);
    }

    @Operation(summary = "Get payment by ID", description = "Retrieve payment details by payment ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @Parameter(description = "Payment ID", required = true)
            @PathVariable Long id) {
        PaymentResponse response = billingService.getPaymentById(id);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get payment by prescription ID", description = "Retrieve payment details by prescription ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @GetMapping("/prescription/{prescriptionId}")
    public ResponseEntity<PaymentResponse> getPaymentByPrescriptionId(
            @Parameter(description = "Prescription ID", required = true)
            @PathVariable String prescriptionId) {
        PaymentResponse response = billingService.getPaymentByPrescriptionId(prescriptionId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create cash payment at reception desk", 
               description = "Creates a cash payment record for receptionist. Payment is completed immediately.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cash payment recorded successfully",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/cash-payment")
    public ResponseEntity<PaymentResponse> createCashPayment(
            @Parameter(description = "Cash payment details", required = true)
            @Valid @RequestBody fit.iuh.billing.dto.CashPaymentRequest request,
            @Parameter(description = "Receptionist ID from authentication", required = true)
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "RECEPTIONIST") String receptionistId) {
        
        log.info("Received cash payment request - Type: {}, ReferenceId: {}, Amount: {}, Receptionist: {}", 
                 request.getPaymentType(), request.getReferenceId(), request.getAmount(), receptionistId);
        
        PaymentResponse response = billingService.createCashPayment(request, receptionistId);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Search payments with filters", 
               description = "Search payments by date range, status, payment method with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payments retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters")
    })
    @GetMapping("/search")
    public ResponseEntity<org.springframework.data.domain.Page<PaymentResponse>> searchPayments(
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @Parameter(description = "Payment status filter")
            @RequestParam(required = false) fit.iuh.billing.enums.PaymentStatus status,
            @Parameter(description = "Payment method filter")
            @RequestParam(required = false) fit.iuh.billing.enums.PaymentMethodType paymentMethod,
            @Parameter(description = "Payment type filter")
            @RequestParam(required = false) fit.iuh.billing.enums.PaymentType paymentType,
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Searching payments - startDate: {}, endDate: {}, status: {}, method: {}, type: {}, page: {}, size: {}", 
                 startDate, endDate, status, paymentMethod, paymentType, page, size);
        
        org.springframework.data.domain.Page<PaymentResponse> payments = billingService.searchPayments(
            startDate, endDate, status, paymentMethod, paymentType, page, size
        );
        
        return ResponseEntity.ok(payments);
    }

    @Operation(summary = "Get today's payments", 
               description = "Retrieve all payments created today (shortcut for receptionists)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Today's payments retrieved successfully")
    })
    @GetMapping("/today")
    public ResponseEntity<java.util.List<PaymentResponse>> getTodayPayments(
            @Parameter(description = "Payment status filter")
            @RequestParam(required = false) fit.iuh.billing.enums.PaymentStatus status
    ) {
        log.info("🔵 [CONTROLLER] Fetching today's payments - status filter: {}", status);
        
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<PaymentResponse> payments = billingService.getTodayPayments(status);
        
        log.info("✅ [CONTROLLER] Returning {} payments to frontend", payments.size());
        if (!payments.isEmpty()) {
            log.debug("   Payments: {}", payments);
            // Log breakdown by type and status
            java.util.Map<String, Long> breakdown = payments.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    p -> p.getPaymentType() + " - " + p.getStatus(),
                    java.util.stream.Collectors.counting()
                ));
            log.info("   Breakdown: {}", breakdown);
        }
        
        return ResponseEntity.ok(payments);
    }

    @Operation(summary = "Get payment by appointment ID", 
               description = "Retrieve payment associated with a specific appointment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "404", description = "Payment not found for this appointment")
    })
    @GetMapping("/by-appointment/{appointmentId}")
    public ResponseEntity<PaymentResponse> getByAppointmentId(
            @Parameter(description = "Appointment ID", required = true)
            @PathVariable String appointmentId) {
        log.info("Fetching payment for appointment: {}", appointmentId);
        
        PaymentResponse response = billingService.getByAppointmentId(appointmentId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get payment by reference ID and type", 
               description = "Retrieve payment by reference ID (appointmentId, labTestId, etc.) and payment type")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    @GetMapping("/by-reference/{referenceId}")
    public ResponseEntity<PaymentResponse> getByReferenceId(
            @Parameter(description = "Reference ID (appointmentId, labTestId, etc.)", required = true)
            @PathVariable String referenceId,
            @Parameter(description = "Payment type")
            @RequestParam(required = false) fit.iuh.billing.enums.PaymentType paymentType
    ) {
        log.info("Fetching payment for reference: {}, type: {}", referenceId, paymentType);
        
        PaymentResponse response = billingService.getByReferenceId(referenceId, paymentType);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get outstanding payments for an appointment", 
               description = "Retrieve all payments (paid and unpaid) for an appointment including lab tests")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Outstanding payments retrieved successfully",
                    content = @Content(schema = @Schema(implementation = OutstandingPaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid reference IDs")
    })
    @GetMapping("/outstanding")
    public ResponseEntity<OutstandingPaymentResponse> getOutstandingPayments(
            @Parameter(description = "List of reference IDs (appointmentId + lab test order IDs)", required = true)
            @RequestParam List<String> referenceIds
    ) {
        log.info("Fetching outstanding payments for reference IDs: {}", referenceIds);
        
        OutstandingPaymentResponse response = billingService.getOutstandingPayments(referenceIds);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Process bulk payment", 
               description = "Process multiple payments in one transaction. Automatically skips already completed payments.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bulk payment processed successfully",
                    content = @Content(schema = @Schema(implementation = BulkPaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or validation failed")
    })
    @PostMapping("/bulk-payment")
    public ResponseEntity<BulkPaymentResponse> processBulkPayment(
            @Valid @RequestBody BulkPaymentRequest request
    ) {
        log.info("Processing bulk payment for {} payments, total: {}", 
                 request.getPaymentCodes().size(), request.getTotalAmount());
        
        BulkPaymentResponse response = billingService.processBulkPayment(request);
        
        log.info("Bulk payment result: {} successful, {} skipped, amount processed: {}", 
                 response.getSuccessfullyProcessed(), 
                 response.getAlreadyCompleted(),
                 response.getAmountProcessed());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/composite-payment")
    @Operation(summary = "Create composite payment", 
               description = "Create a single payment URL for all outstanding fees (appointment fee + lab tests) for online payment methods (MOMO, VNPAY)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Composite payment created successfully",
                    content = @Content(schema = @Schema(implementation = CompositePaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or no outstanding payments found"),
            @ApiResponse(responseCode = "500", description = "Error creating composite payment")
    })
    public ResponseEntity<CompositePaymentResponse> createCompositePayment(
            @Parameter(description = "Composite payment request with appointmentId and payment method", required = true)
            @Valid @RequestBody CompositePaymentRequest request
    ) {
        log.info("Creating composite payment for appointment: {}, method: {}", 
                 request.getAppointmentId(), request.getPaymentMethod());
        
        try {
            CompositePaymentResponse response = billingService.createCompositePayment(request);
            log.info("Composite payment created successfully: {}, total: {}", 
                     response.getPaymentCode(), response.getTotalAmount());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid composite payment request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating composite payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}