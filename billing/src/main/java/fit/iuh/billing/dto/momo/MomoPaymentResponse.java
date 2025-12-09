package fit.iuh.billing.dto.momo;

import lombok.Data;

import java.io.Serializable;

@Data
public class MomoPaymentResponse implements Serializable {
    private String partnerCode;
    private String orderId;
    private String requestId;
    private Long amount;
    private String orderInfo;
    private String message;
    private String resultCode;
    private String payUrl; // URL để chuyển hướng người dùng
    private String signature;
    private String transId; // Transaction ID từ Momo
}