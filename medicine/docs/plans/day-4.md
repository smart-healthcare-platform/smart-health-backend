# Ngày 4: Hoàn thiện Quy trình Quản lý Đơn thuốc

**Mục tiêu:** Hoàn thiện vòng đời của một đơn thuốc bằng cách xây dựng các API truy vấn và cập nhật trạng thái.

## Tasks

1.  **Xây dựng API Truy vấn Đơn thuốc:**
    *   Trong `PrescriptionController`, thêm endpoint `GET /api/v1/prescriptions/{id}`.
    *   Trong `PrescriptionController`, thêm endpoint `GET /api/v1/patients/{patientId}/prescriptions`.
    *   Implement logic tương ứng trong `PrescriptionService` và `PrescriptionRepository` để lấy dữ liệu từ CSDL.
    *   Tạo các DTOs (`PrescriptionDetailDto`, `PrescriptionSummaryDto`) để trả về dữ liệu một cách có cấu trúc, tránh trả về trực tiếp entity.

2.  **Xây dựng API Nội bộ cho Billing Service:**
    *   Tạo `InternalController` hoặc một phương thức riêng trong `PrescriptionController` cho endpoint `POST /api/v1/internal/prescriptions/{id}/confirm-payment`.
    *   **Quan trọng:** Endpoint này cần được bảo mật và chỉ cho phép `Billing Service` gọi. (Sẽ cấu hình chi tiết hơn ở Ngày 7).
    *   Implement logic trong `PrescriptionService` để tìm đơn thuốc theo `id` và cập nhật trường `status` thành `COMPLETED`.

3.  **Cải thiện Logic:**
    *   Đảm bảo các API truy vấn chỉ trả về chi tiết đơn thuốc cho bệnh nhân nếu trạng thái là `COMPLETED`, theo yêu cầu trong `README.md`.
    *   Thêm xử lý ngoại lệ (Exception Handling) cho các trường hợp không tìm thấy đơn thuốc (`PrescriptionNotFoundException`).

## Công nghệ sử dụng

*   **Framework:** Spring Boot (`spring-web`, `spring-data-jpa`)
*   **Exception Handling:** `@ControllerAdvice`, `@ExceptionHandler`

## Kết quả mong đợi

*   Các API `GET` để truy vấn đơn thuốc hoạt động chính xác.
*   API nội bộ cho phép `Billing Service` cập nhật trạng thái đơn thuốc thành công.
*   Quy trình từ lúc tạo đơn (`PENDING_PAYMENT`) đến lúc hoàn tất (`COMPLETED`) đã được định hình rõ ràng.
*   Hệ thống có khả năng xử lý các lỗi cơ bản như không tìm thấy tài nguyên.