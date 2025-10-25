package fit.iuh.billing.enums;

/**
 * Enum đại diện cho các phương thức thanh toán được hỗ trợ.
 */
public enum PaymentMethodType {
    /**
     * Thanh toán qua Ví điện tử MoMo.
     */
    MOMO,

    /**
     * Thanh toán qua Cổng thanh toán VNPay.
     */
    VNPAY,

    /**
     * Thanh toán tại quầy lễ tân.
     */
    CASH
}