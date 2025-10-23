package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentMethodType;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fit.iuh.billing.dto.momo.MomoPaymentRequest;
import fit.iuh.billing.dto.momo.MomoPaymentResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service("momoPaymentGatewayService") // Đặt tên bean rõ ràng
public class MomoPaymentGatewayService implements PaymentGatewayService {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.api-endpoint}")
    private String apiEndpoint;

    @Value("${momo.return-url}")
    private String returnUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    private PaymentRepository paymentRepository;
    
    @Autowired(required = false) // Optional vì có thể không cần thiết
    private AppointmentServiceClient appointmentServiceClient;
    
    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;

    public MomoPaymentGatewayService(
            PaymentRepository paymentRepository, 
            RestTemplate restTemplate, 
            ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private static final String MOMO_REQUEST_TYPE = "captureWallet";

    @Override
    public String createPaymentUrl(Payment payment) {
        try {
            // Sử dụng cấu hình từ application.properties
            String currentPartnerCode = partnerCode;
            String currentAccessKey = accessKey;
            String currentSecretKey = secretKey;
            String currentApiEndpoint = apiEndpoint;
            String currentReturnUrl = returnUrl;
            String currentIpnUrl = ipnUrl;

            // Tạo order info dựa trên loại thanh toán
            String orderInfo = buildOrderInfo(payment);

            // 1. Tạo request object mà KHÔNG có signature
            MomoPaymentRequest momoRequestWithoutSignature = MomoPaymentRequest.builder()
                    .partnerCode(currentPartnerCode)
                    .partnerName("Smart Health App")
                    .storeId("SmartHealthStore")
                    .requestId(payment.getPaymentCode())
                    .amount(payment.getAmount().longValue())
                    .orderId(payment.getPaymentCode())
                    .orderInfo(orderInfo)
                    .redirectUrl(currentReturnUrl)
                    .ipnUrl(currentIpnUrl)
                    .lang("vi")
                    .requestType(MOMO_REQUEST_TYPE)
                    .extraData("")
                    .build();

            // 2. Tạo rawData theo thứ tự cố định mà MoMo yêu cầu cho requestType = captureWallet
            // Thứ tự: accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType
            String rawData = buildCaptureWalletRawData(momoRequestWithoutSignature, currentAccessKey);
            String signature = generateSignatureFromRawData(rawData, currentSecretKey);
            // Log rawData và signature để debug (cẩn thận với secretKey, không log secretKey)
            log.debug("MOMO rawData for signature: {}", rawData);
            log.debug("MOMO generated signature: {}", signature);

            // 3. Tạo request object HOÀN CHỈNH với signature
            MomoPaymentRequest momoRequest = MomoPaymentRequest.builder()
                    .partnerCode(momoRequestWithoutSignature.getPartnerCode())
                    .partnerName(momoRequestWithoutSignature.getPartnerName())
                    .storeId(momoRequestWithoutSignature.getStoreId())
                    .requestId(momoRequestWithoutSignature.getRequestId())
                    .amount(momoRequestWithoutSignature.getAmount())
                    .orderId(momoRequestWithoutSignature.getOrderId())
                    .orderInfo(momoRequestWithoutSignature.getOrderInfo())
                    .redirectUrl(momoRequestWithoutSignature.getRedirectUrl())
                    .ipnUrl(momoRequestWithoutSignature.getIpnUrl())
                    .lang(momoRequestWithoutSignature.getLang())
                    .requestType(momoRequestWithoutSignature.getRequestType())
                    .extraData(momoRequestWithoutSignature.getExtraData())
                    .signature(signature)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<MomoPaymentRequest> requestEntity = new HttpEntity<>(momoRequest, headers);

            MomoPaymentResponse momoResponse = restTemplate.postForObject(currentApiEndpoint, requestEntity, MomoPaymentResponse.class);

            if (momoResponse != null && "0".equals(momoResponse.getResultCode())) {
                return momoResponse.getPayUrl();
            } else {
                log.error("Failed to create Momo payment URL. Response: {}", momoResponse);
                throw new RuntimeException("Failed to create Momo payment URL: " + (momoResponse != null ? momoResponse.getMessage() : "Unknown error"));
            }

        } catch (Exception e) {
            log.error("Error creating Momo payment URL", e);
            throw new RuntimeException("Error creating Momo payment URL: " + e.getMessage());
        }
    }

    /**
     * Builds raw data string from a map for signature generation.
     * The string is formatted as "key1=value1&key2=value2&..." with keys sorted alphabetically.
     * Empty string values are excluded, similar to the old payment-service.
     */
    private String buildRawDataFromMap(Map<String, Object> params) {
        StringBuilder data = new StringBuilder();
        params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    // Chỉ thêm các tham số có giá trị không null và không phải là "signature"
                    // Loại bỏ các tham số có giá trị là chuỗi rỗng ("")
                    if (!entry.getKey().equals("signature") && entry.getValue() != null && !entry.getValue().toString().isEmpty()) {
                        data.append(entry.getKey()).append("=").append(entry.getValue()).append("&");
                    }
                });
        // Xóa ký tự '&' cuối cùng nếu có
        if (data.length() > 0) {
            data.deleteCharAt(data.length() - 1);
        }
        return data.toString();
    }

    /**
     * Build raw data string for MOMO captureWallet request in exact order required by MOMO.
     * Order must be: accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType
     * Include empty extraData explicitly if provided as empty string.
     */
    private String buildCaptureWalletRawData(MomoPaymentRequest req, String accessKey) {
        String extraData = req.getExtraData() == null ? "" : req.getExtraData();
        StringBuilder sb = new StringBuilder();
        sb.append("accessKey=").append(accessKey)
          .append("&amount=").append(req.getAmount())
          .append("&extraData=").append(extraData)
          .append("&ipnUrl=").append(req.getIpnUrl())
          .append("&orderId=").append(req.getOrderId())
          .append("&orderInfo=").append(req.getOrderInfo())
          .append("&partnerCode=").append(req.getPartnerCode())
          .append("&redirectUrl=").append(req.getRedirectUrl())
          .append("&requestId=").append(req.getRequestId())
          .append("&requestType=").append(req.getRequestType());
        return sb.toString();
    }

    /**
     * Generates signature directly from the raw data string.
     */
    private String generateSignatureFromRawData(String rawData, String secretKey) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(rawData.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            log.error("Error generating signature for Momo: {}", e.getMessage());
            throw new RuntimeException("Error generating signature for Momo", e);
        }
    }

    @Override
    public void processIpn(Map<String, String> ipnData) {
        try {
            String paymentCode = ipnData.get("requestId");
            String momoResponseCode = ipnData.get("resultCode");
            String momoTransactionId = ipnData.get("transId");
            String momoAmount = ipnData.get("amount");
            String momoSignature = ipnData.get("signature");

            log.info("Processing MOMO IPN for payment code: {}", paymentCode);
            log.info("MOMO response code: {}", momoResponseCode);

            // Verify signature
            // Tạo chuỗi rawData để tạo signature cho IPN
            // Các tham số cần được sắp xếp theo thứ tự alphabet và khớp với tài liệu Momo
            // LƯU Ý: Chuỗi rawData phải khớp chính xác với cách Momo tạo chữ ký
            // Verify signature
            // The rawData for the IPN signature is created by concatenating all fields in the IPN request
            // PLUS the merchant's accessKey, sorted alphabetically.
            Map<String, String> ipnSignatureParams = new HashMap<>(ipnData);
            ipnSignatureParams.remove("signature");
            ipnSignatureParams.put("accessKey", this.accessKey); // This is the crucial missing piece

            String generatedSignature = generateSignature(ipnSignatureParams, secretKey);

            if (!Objects.equals(generatedSignature, momoSignature)) {
                log.error("Invalid MOMO IPN signature for payment code: {}", paymentCode);
                throw new RuntimeException("Invalid MOMO IPN signature.");
            }

            boolean isSuccessful = "0".equals(momoResponseCode); // MoMo success code is 0

            Optional<Payment> optionalPayment = paymentRepository.findByPaymentCode(paymentCode);
            if (optionalPayment.isEmpty()) {
                log.error("Payment not found with code: {}", paymentCode);
                throw new RuntimeException("Payment not found with code: " + paymentCode);
            }

            Payment payment = optionalPayment.get();

            // Kiểm tra trùng lặp IPN (optional nhưng nên có)
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                log.warn("MOMO IPN already processed for payment code: {}", paymentCode);
                return; // Đã xử lý rồi, bỏ qua
            }

            payment.setTransactionId(momoTransactionId);
            payment.setUpdatedAt(LocalDateTime.now());

            if (isSuccessful) {
                payment.setStatus(PaymentStatus.COMPLETED);
                log.info("Payment {} COMPLETED via MOMO IPN.", paymentCode);
                
                // Thông báo cho service tương ứng dựa trên loại thanh toán
                notifyRelatedService(payment);
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                log.warn("Payment {} FAILED via MOMO IPN. Response code: {}", paymentCode, momoResponseCode);
            }

            paymentRepository.save(payment);
            log.info("Payment {} updated to status: {}", paymentCode, payment.getStatus());

        } catch (Exception e) {
            log.error("Error processing MOMO IPN", e);
            throw new RuntimeException("Error processing MOMO IPN: " + e.getMessage());
        }
    }
    
    /**
     * Tạo order info description dựa trên loại thanh toán
     */
    private String buildOrderInfo(Payment payment) {
        if (payment.getPaymentType() == null) {
            // Fallback cho code cũ
            return "Thanh toan " + payment.getReferenceId();
        }
        
        switch (payment.getPaymentType()) {
            case APPOINTMENT_FEE:
                return "Thanh toan phi kham benh - " + payment.getReferenceId();
            case LAB_TEST:
                return "Thanh toan xet nghiem - " + payment.getReferenceId();
            case PRESCRIPTION:
                return "Thanh toan don thuoc - " + payment.getReferenceId();
            case OTHER:
            default:
                return "Thanh toan dich vu y te - " + payment.getReferenceId();
        }
    }
    
    /**
     * Thông báo cho service liên quan khi thanh toán thành công
     */
    private void notifyRelatedService(Payment payment) {
        if (payment.getPaymentType() == null) {
            log.warn("Payment {} has no paymentType, skipping service notification", payment.getPaymentCode());
            return;
        }
        
        try {
            switch (payment.getPaymentType()) {
                case APPOINTMENT_FEE:
                    if (appointmentServiceClient != null) {
                        log.info("Notifying Appointment Service for payment {}", payment.getPaymentCode());
                        
                        // Tạo request body với paymentId và amount
                        fit.iuh.billing.dto.ConfirmPaymentRequest request = 
                            fit.iuh.billing.dto.ConfirmPaymentRequest.builder()
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
                    // TODO: Implement LabTestServiceClient when needed
                    log.info("Lab test payment confirmed: {}", payment.getReferenceId());
                    break;
                    
                case PRESCRIPTION:
                    // KHÔNG cần thiết - hệ thống không bán thuốc
                    log.warn("Prescription payment type is deprecated - system does not sell medicine");
                    break;
                    
                case OTHER:
                default:
                    log.info("Payment type {} completed for {}", payment.getPaymentType(), payment.getReferenceId());
                    break;
            }
        } catch (Exception e) {
            log.error("Error notifying related service for payment {}: {}", 
                payment.getPaymentCode(), e.getMessage());
            // Không throw exception - payment đã được xử lý thành công
            // Notification failure không nên rollback payment
        }
    }

    private String generateSignature(Map<String, String> params, String secretKey) {
        try {
            StringBuilder data = new StringBuilder();
            params.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(entry -> {
                        // Chỉ thêm các tham số có giá trị không null và không phải là "signature"
                        // Bao gồm cả các tham số có giá trị là chuỗi rỗng ("")
                        // Quan trọng: Phải bao gồm cả các trường có giá trị rỗng (empty string) theo tài liệu của Momo.
                        // Chỉ bỏ qua trường có giá trị null.
                        if (!entry.getKey().equals("signature") && entry.getValue() != null) {
                            data.append(entry.getKey()).append("=").append(entry.getValue()).append("&");
                        }
                    });
            // Xóa ký tự '&' cuối cùng nếu có
            if (data.length() > 0) {
                data.deleteCharAt(data.length() - 1);
            }

            log.info("Raw data for IPN signature: {}", data.toString());

            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            log.error("Error generating signature for Momo: {}", e.getMessage());
            throw new RuntimeException("Error generating signature for Momo", e);
        }
    }
}