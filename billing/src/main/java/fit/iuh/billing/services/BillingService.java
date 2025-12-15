package fit.iuh.billing.services;

import fit.iuh.billing.dto.BulkPaymentRequest;
import fit.iuh.billing.dto.BulkPaymentResponse;
import fit.iuh.billing.dto.CashPaymentRequest;
import fit.iuh.billing.dto.CompositePaymentRequest;
import fit.iuh.billing.dto.CompositePaymentResponse;
import fit.iuh.billing.dto.CreatePaymentRequest;
import fit.iuh.billing.dto.OutstandingPaymentResponse;
import fit.iuh.billing.dto.PaymentResponse;

import java.util.List;
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
     * Tạo thanh toán tiền mặt tại quầy (dành cho Receptionist).
     * Payment sẽ được tạo với status = COMPLETED ngay lập tức.
     * 
     * @param request Thông tin thanh toán tiền mặt.
     * @param receptionistId ID của lễ tân thực hiện thanh toán.
     * @return Thông tin thanh toán đã tạo.
     */
    PaymentResponse createCashPayment(CashPaymentRequest request, String receptionistId);

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

    /**
     * Tìm kiếm payments với các filter.
     * 
     * @param startDate Ngày bắt đầu (optional)
     * @param endDate Ngày kết thúc (optional)
     * @param status Trạng thái thanh toán (optional)
     * @param paymentMethod Phương thức thanh toán (optional)
     * @param paymentType Loại thanh toán (optional)
     * @param page Số trang (0-based)
     * @param size Kích thước trang
     * @return Trang kết quả payments
     */
    org.springframework.data.domain.Page<PaymentResponse> searchPayments(
        java.time.LocalDate startDate,
        java.time.LocalDate endDate,
        fit.iuh.billing.enums.PaymentStatus status,
        fit.iuh.billing.enums.PaymentMethodType paymentMethod,
        fit.iuh.billing.enums.PaymentType paymentType,
        int page,
        int size
    );

    /**
     * Lấy danh sách payments của hôm nay.
     * 
     * @param status Lọc theo trạng thái (optional)
     * @return Danh sách payments hôm nay
     */
    java.util.List<PaymentResponse> getTodayPayments(fit.iuh.billing.enums.PaymentStatus status);

    /**
     * Lấy payment theo appointmentId.
     * 
     * @param appointmentId ID của appointment
     * @return Payment response
     */
    PaymentResponse getByAppointmentId(String appointmentId);

    /**
     * Lấy payment theo referenceId và paymentType.
     * 
     * @param referenceId ID tham chiếu
     * @param paymentType Loại thanh toán (optional, nếu null thì tìm tất cả)
     * @return Payment response
     */
    PaymentResponse getByReferenceId(String referenceId, fit.iuh.billing.enums.PaymentType paymentType);

    /**
     * Lấy tất cả payments chưa thanh toán của một appointment.
     * Bao gồm cả phí khám và xét nghiệm.
     * 
     * @param referenceIds Danh sách reference IDs (appointmentId + lab test order IDs)
     * @return Outstanding payment response với tổng tiền và chi tiết
     */
    OutstandingPaymentResponse getOutstandingPayments(List<String> referenceIds);

    /**
     * Thanh toán nhiều payments cùng lúc (bulk payment).
     * Dùng cho receptionist khi thu tiền tổng hợp.
     * 
     * @param request Bulk payment request với danh sách payment codes
     * @return BulkPaymentResponse với thông tin chi tiết về payments đã xử lý
     */
    BulkPaymentResponse processBulkPayment(BulkPaymentRequest request);

    /**
     * Tạo thanh toán tổng hợp (composite payment) cho một appointment.
     * Tìm tất cả payments chưa thanh toán (APPOINTMENT_FEE + LAB_TEST),
     * tạo một payment cha với tổng số tiền và URL thanh toán duy nhất.
     * Các payment con sẽ được liên kết với payment cha và tự động cập nhật
     * khi payment cha được thanh toán thành công.
     * 
     * @param request Composite payment request với appointmentId và paymentMethod
     * @return Composite payment response với paymentUrl và breakdown
     */
    CompositePaymentResponse createCompositePayment(CompositePaymentRequest request);

    /**
     * Hủy một payment (chỉ áp dụng cho payments ở trạng thái PENDING hoặc PROCESSING).
     * Thường dùng để hủy các online payments (MOMO/VNPAY) đã expired hoặc không hoàn tất,
     * trước khi tạo payment tiền mặt mới.
     * 
     * @param paymentCode Mã payment cần hủy
     * @return Payment response sau khi hủy (status = CANCELLED)
     */
    PaymentResponse cancelPayment(String paymentCode);
}