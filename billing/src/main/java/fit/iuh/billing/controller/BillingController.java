package fit.iuh.billing.controller;

import fit.iuh.billing.dto.CreatePaymentRequest;
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
import java.util.Map;

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
}