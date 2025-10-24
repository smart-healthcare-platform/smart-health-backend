package fit.iuh.billing.services;

import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.PaymentResponse;

import java.util.Map;

/**
 * Service chính chịu trách nhiệm cho các nghiệp vụ thanh toán.
 */
public interface BillingService {

    /**
     * Tạo một yêu cầu thanh toán mới.
     * Hỗ trợ nhiều loại thanh toán: APPOINTMENT_FEE, LAB_TEST, PRESCRIPTION, OTHER
     * 
     * @param request Thông tin yêu cầu thanh toán với paymentType và referenceId.
     * @return Phản hồi chứa URL thanh toán và các thông tin khác.
     */
    PaymentResponse createPayment(CreatePaymentRequest request);

    /**
     * Xử lý thông báo IPN từ một cổng thanh toán.
     * @param gateway Tên của cổng thanh toán (ví dụ: "momo", "vnpay").
     * @param ipnData Dữ liệu IPN.
     */
    void processIpn(String gateway, Map<String, String> ipnData);

    /**
     * Lấy thông tin thanh toán bằng ID.
     * @param id ID của thanh toán.
     * @return Thông tin chi tiết của thanh toán.
     */
    PaymentResponse getPaymentById(Long id);

    /**
     * Lấy thông tin thanh toán bằng mã đơn thuốc.
     * @deprecated Sử dụng getPaymentByReferenceId() thay thế
     * @param prescriptionId ID của đơn thuốc.
     * @return Thông tin chi tiết của thanh toán.
     */
    @Deprecated
    PaymentResponse getPaymentByPrescriptionId(String prescriptionId);
}