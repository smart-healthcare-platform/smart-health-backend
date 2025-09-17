# Ngày 6: Tích hợp Notification Service và Xuất file PDF (UC-03)

**Mục tiêu:** Hoàn thiện các tính năng hỗ trợ bệnh nhân và bác sĩ sau khi đơn thuốc được tạo.

## Tasks

1.  **Tích hợp Notification Service:**
    *   Tạo `NotificationClient` để giao tiếp với `Notification Service`.
    *   Trong `PrescriptionService`, sau khi đơn thuốc được tạo thành công, sử dụng `@Async` để gọi một phương thức mới: `sendMedicationScheduleToNotificationService`.
    *   Phương thức này sẽ:
        *   Xử lý thông tin đơn thuốc để tạo ra một cấu trúc lịch trình uống thuốc.
        *   Gửi request chứa `patient_id` và lịch trình này đến `Notification Service`.
    *   Kích hoạt tính năng bất đồng bộ trong Spring Boot bằng `@EnableAsync`.

2.  **Xây dựng Chức năng Xuất PDF:**
    *   Thêm dependency cho thư viện tạo PDF (ví dụ: `com.itextpdf:itext7-core`).
    *   Tạo `PdfGenerationService` để đóng gói logic tạo file PDF.
    *   Tạo `PrescriptionController` với endpoint `GET /api/v1/prescriptions/{id}/pdf`.
    *   **Logic chính:**
        *   Lấy thông tin chi tiết của đơn thuốc.
        *   **Kiểm tra quyền và trạng thái:** Chỉ cho phép xuất PDF nếu người dùng có quyền và trạng thái đơn thuốc là `COMPLETED`.
        *   Sử dụng `PdfGenerationService` để tạo file PDF theo mẫu.
        *   Trả về file PDF trong `ResponseEntity` với `MediaType.APPLICATION_PDF`.

## Công nghệ sử dụng

*   **Asynchronous Processing:** Spring Boot `@Async`, `@EnableAsync`.
*   **PDF Generation:** iText 7 hoặc Apache PDFBox.
*   **Framework:** Spring Boot (`spring-web`).

## Kết quả mong đợi

*   Sau khi tạo đơn thuốc, một yêu cầu được gửi tự động đến `Notification Service` để nhắc nhở bệnh nhân.
*   Việc gửi thông báo không làm chậm quá trình tạo đơn thuốc của bác sĩ.
*   Bác sĩ có thể tải về file PDF của đơn thuốc sau khi thanh toán được xác nhận.
*   Chức năng xuất PDF được bảo mật, chỉ những người có quyền và ở đúng trạng thái mới có thể sử dụng.