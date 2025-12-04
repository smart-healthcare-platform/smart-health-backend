package fit.iuh.billing.services.impl;

import fit.iuh.billing.client.AppointmentServiceClient;
import fit.iuh.billing.entity.Payment;
import fit.iuh.billing.enums.PaymentStatus;
import fit.iuh.billing.enums.PaymentType;
import fit.iuh.billing.repository.PaymentRepository;
import fit.iuh.billing.services.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service("vnPayPaymentGatewayService") // Đặt tên bean rõ ràng
public class VNPayPaymentGatewayService implements PaymentGatewayService {

    @Value("${vnpay.version}")
    private String vnp_Version;
    @Value("${vnpay.command}")
    private String vnp_Command;
    @Value("${vnpay.tmn-code}")
    private String vnp_TmnCode;
    @Value("${vnpay.amount-factor}")
    private int vnp_AmountFactor;
    @Value("${vnpay.curr-code}")
    private String vnp_CurrCode;
    @Value("${vnpay.bank-code}")
    private String vnp_BankCode;
    @Value("${vnpay.locale}")
    private String vnp_Locale;
    @Value("${vnpay.return-url}")
    private String vnp_ReturnUrl;
    @Value("${vnpay.secret-key}")
    private String vnp_HashSecret;
    @Value("${vnpay.pay-url}")
    private String vnp_PayUrl;

    private final PaymentRepository paymentRepository;
    
    @Autowired(required = false) // Optional dependency
    private AppointmentServiceClient appointmentServiceClient;

    public VNPayPaymentGatewayService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    public String createPaymentUrl(Payment payment) {
        try {
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(payment.getAmount().longValue() * vnp_AmountFactor));
            vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
            // Only include bank code if configured. Leaving it out lets VNPay show bank selection to user.
            if (vnp_BankCode != null && !vnp_BankCode.isBlank()) {
                vnp_Params.put("vnp_BankCode", vnp_BankCode);
                log.debug("Including vnp_BankCode in VNPay params: {}", vnp_BankCode);
            } else {
                log.debug("vnp_BankCode is empty; VNPay will present bank selection to the user.");
            }
            vnp_Params.put("vnp_TxnRef", payment.getPaymentCode()); // Mã giao dịch của hệ thống
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don thuoc " + payment.getPrescriptionId());
            vnp_Params.put("vnp_OrderType", "billpayment");
            vnp_Params.put("vnp_Locale", vnp_Locale);
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", "127.0.0.1"); // Lấy IP của người dùng thực tế
            vnp_Params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            // Add expire date (VNPay 2.1.0 demo uses vnp_ExpireDate)
            vnp_Params.put("vnp_ExpireDate", LocalDateTime.now().plusMinutes(15).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

            // Build URL
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(vnp_PayUrl);

            // Sort params by key
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Build hash data
                    hashData.append(fieldName);
                    hashData.append("=");
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                    // Build query url
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString()));
                    query.append("=");
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                    if (itr.hasNext()) {
                        query.append("&");
                        hashData.append("&");
                    }
                }
            }
            String queryUrl = query.toString();

            // DEBUG: log canonical string used for hash
            log.debug("VNPay canonical hashData: {}", hashData.toString());

            String vnp_SecureHash = hmacSHA512(vnp_HashSecret, hashData.toString());

            // DEBUG: log computed secure hash and full payment URL
            log.debug("VNPay computed vnp_SecureHash: {}", vnp_SecureHash);

            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

            String paymentUrl = vnp_PayUrl + "?" + queryUrl;
            log.debug("VNPay paymentUrl: {}", paymentUrl);

            return paymentUrl;

        } catch (UnsupportedEncodingException e) {
            log.error("Error creating VNPay payment URL: {}", e.getMessage());
            throw new RuntimeException("Error creating VNPay payment URL", e);
        }
    }

    @Override
    public void processIpn(Map<String, String> ipnData) {
        try {
            String vnp_ResponseCode = ipnData.get("vnp_ResponseCode");
            String vnp_TransactionStatus = ipnData.get("vnp_TransactionStatus");
            String vnp_TxnRef = ipnData.get("vnp_TxnRef"); // Payment Code của hệ thống
            String vnp_Amount = ipnData.get("vnp_Amount");
            String vnp_SecureHash = ipnData.get("vnp_SecureHash");

            log.info("Processing VNPAY IPN for payment code: {}", vnp_TxnRef);

            // Verify signature
            Map<String, String> vnp_Params = new HashMap<>(ipnData);
            vnp_Params.remove("vnp_SecureHash"); // Remove hash ra khỏi data để kiểm tra

            String generatedHash = hmacSHA512(vnp_HashSecret, getHashData(vnp_Params));

            if (!Objects.equals(generatedHash, vnp_SecureHash)) {
                log.error("Invalid VNPAY IPN signature for payment code: {}", vnp_TxnRef);
                throw new RuntimeException("Invalid VNPAY IPN signature.");
            }

            boolean isSuccessful = "00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus); // VNPay success codes

            Optional<Payment> optionalPayment = paymentRepository.findByPaymentCode(vnp_TxnRef);
            if (optionalPayment.isEmpty()) {
                log.error("Payment not found with code: {}", vnp_TxnRef);
                throw new RuntimeException("Payment not found with code: " + vnp_TxnRef);
            }

            Payment payment = optionalPayment.get();

            // Kiểm tra trùng lặp IPN
            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                log.warn("VNPAY IPN already processed for payment code: {}", vnp_TxnRef);
                return; // Đã xử lý rồi, bỏ qua
            }

            payment.setTransactionId(ipnData.get("vnp_TransactionNo")); // ID giao dịch của VNPay
            payment.setUpdatedAt(LocalDateTime.now());

            if (isSuccessful) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
                log.info("Payment {} COMPLETED via VNPAY IPN.", vnp_TxnRef);
                
                // Nếu là composite payment, cascade status updates sang child payments
                if (payment.getPaymentType() == PaymentType.COMPOSITE_PAYMENT) {
                    cascadeCompositePaymentStatus(payment, ipnData.get("vnp_TransactionNo"));
                } else {
                    // Thông báo cho service tương ứng dựa trên loại thanh toán
                    notifyRelatedService(payment);
                }
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                log.warn("Payment {} FAILED via VNPAY IPN. Response code: {} / Transaction status: {}",
                        vnp_TxnRef, vnp_ResponseCode, vnp_TransactionStatus);
                
                // Nếu là composite payment, cascade failed status sang child payments
                if (payment.getPaymentType() == PaymentType.COMPOSITE_PAYMENT) {
                    cascadeCompositePaymentFailure(payment);
                }
            }

            paymentRepository.save(payment);
            log.info("Payment {} updated to status: {}", vnp_TxnRef, payment.getStatus());

        } catch (Exception e) {
            log.error("Error processing VNPAY IPN", e);
            throw new RuntimeException("Error processing VNPAY IPN: " + e.getMessage());
        }
    }
    
    /**
     * Cascade status updates từ composite payment sang tất cả child payments
     * Khi composite payment thành công, tất cả child payments cũng được đánh dấu COMPLETED
     */
    private void cascadeCompositePaymentStatus(Payment compositePayment, String transactionId) {
        log.info("Cascading COMPLETED status from composite payment {} to child payments", 
                 compositePayment.getPaymentCode());
        
        if (compositePayment.getChildPayments() == null || compositePayment.getChildPayments().isEmpty()) {
            log.warn("Composite payment {} has no child payments", compositePayment.getPaymentCode());
            return;
        }
        
        LocalDateTime paidAt = LocalDateTime.now();
        
        for (Payment childPayment : compositePayment.getChildPayments()) {
            childPayment.setStatus(PaymentStatus.COMPLETED);
            childPayment.setTransactionId(transactionId); // Cùng transaction ID
            childPayment.setPaidAt(paidAt); // Cùng thời gian thanh toán
            childPayment.setUpdatedAt(paidAt);
            
            log.info("Updated child payment {} to COMPLETED", childPayment.getPaymentCode());
            
            // Thông báo cho service liên quan
            notifyRelatedService(childPayment);
        }
        
        // Lưu tất cả child payments
        paymentRepository.saveAll(compositePayment.getChildPayments());
        log.info("Successfully cascaded status to {} child payments", compositePayment.getChildPayments().size());
    }
    
    /**
     * Cascade FAILED status từ composite payment sang child payments
     */
    private void cascadeCompositePaymentFailure(Payment compositePayment) {
        log.info("Cascading FAILED status from composite payment {} to child payments", 
                 compositePayment.getPaymentCode());
        
        if (compositePayment.getChildPayments() == null || compositePayment.getChildPayments().isEmpty()) {
            log.warn("Composite payment {} has no child payments", compositePayment.getPaymentCode());
            return;
        }
        
        for (Payment childPayment : compositePayment.getChildPayments()) {
            childPayment.setStatus(PaymentStatus.FAILED);
            childPayment.setUpdatedAt(LocalDateTime.now());
            log.info("Updated child payment {} to FAILED", childPayment.getPaymentCode());
        }
        
        paymentRepository.saveAll(compositePayment.getChildPayments());
        log.info("Successfully cascaded FAILED status to {} child payments", compositePayment.getChildPayments().size());
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
                    log.info("Lab test payment confirmed: {}", payment.getReferenceId());
                    break;
                    
                case PRESCRIPTION:
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
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmacSHA512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmacSHA512.init(secretKey);
            byte[] hash = hmacSHA512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            Formatter formatter = new Formatter();
            for (byte b : hash) {
                formatter.format("%02x", b);
            }
            return formatter.toString();
        } catch (Exception e) {
            log.error("Error generating HmacSHA512 signature: {}", e.getMessage());
            throw new RuntimeException("Error generating HmacSHA512 signature", e);
        }
    }

    private String getHashData(Map<String, String> fields) throws UnsupportedEncodingException {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append("=");
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                if (itr.hasNext()) {
                    hashData.append("&");
                }
            }
        }
        return hashData.toString();
    }
}