package fit.iuh.billing.dto.momo;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class MomoPaymentRequest implements Serializable {
    private String partnerCode;
    private String partnerName;
    private String storeId;
    private String requestId;
    private Long amount;
    private String orderId;
    private String orderInfo;
    private String redirectUrl;
    private String ipnUrl;
    private String lang;
    private String requestType;
    private String extraData;
    private String signature;
}