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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/billings")
@RequiredArgsConstructor
@Tag(name = "Billing API", description = "APIs for payment processing and management")
public class BillingController {

    private final BillingService billingService;

    @Operation(summary = "Create a new payment request", description = "Creates a payment request for a prescription and returns a payment URL.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment request created successfully",
                    content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or unsupported payment method")
    })
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Parameter(description = "Payment request details", required = true)
            @Valid @RequestBody CreatePaymentRequest request) {
        log.info("Received request to create payment for prescriptionId: {}", request.getPrescriptionId());
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

    @Operation(summary = "Handle return from payment gateway (for user redirection)", description = "Endpoint for user redirection after completing payment on gateway. This endpoint primarily for UX.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Return handled successfully"),
            @ApiResponse(responseCode = "400", description = "Error handling return")
    })
    @GetMapping("/return")
    public ResponseEntity<Map<String, String>> handleReturnFromGateway(@RequestParam Map<String, String> params) {
        log.info("Received return from payment gateway. Params: {}", params);
        // Logic here is primarily for user experience, e.g., redirect to a success/failure page
        // The actual payment status update should come from IPN
        Map<String, String> response = new HashMap<>();
        response.put("message", "Payment return received. Status will be updated via IPN.");
        return ResponseEntity.ok(response);
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
}