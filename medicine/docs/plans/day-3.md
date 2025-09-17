# Ngày 3: Xây dựng chức năng tạo Đơn thuốc (UC-01)

**Mục tiêu:** Implement luồng nghiệp vụ cốt lõi: tạo một đơn thuốc mới.

## Tasks

1.  **Tạo DTOs cho Request/Response:**
    *   `CreatePrescriptionRequest.java`: Định nghĩa cấu trúc dữ liệu client gửi lên, bao gồm `patientId`, `diagnosis`, `notes`, và danh sách các `PrescriptionItemDto`.
    *   `PrescriptionItemDto.java`: Chứa `drugId`, `dosage`, `frequency`, v.v.
    *   `PrescriptionResponse.java`: Dữ liệu trả về sau khi tạo thành công, chứa `prescriptionId` và `status`.

2.  **Xây dựng API Tạo Đơn thuốc:**
    *   Tạo `PrescriptionController` với endpoint `POST /api/v1/prescriptions`.
    *   Sử dụng `@Valid` để kích hoạt validation cho request body.

3.  **Implement Business Logic trong Service:**
    *   Tạo `PrescriptionService`.
    *   **Logic chính:**
        *   Nhận `CreatePrescriptionRequest`.
        *   Gọi sang `Patient Service` (sử dụng client đã tạo ở Ngày 2) để lấy thông tin bệnh nhân (ví dụ: kiểm tra sự tồn tại).
        *   Tạo một `Prescription` entity và lưu vào CSDL với trạng thái mặc định là `PENDING_PAYMENT`.
        *   Lặp qua danh sách `PrescriptionItemDto`, tạo các `PrescriptionItem` entity tương ứng và lưu lại.
        *   Tất cả các thao tác ghi CSDL phải được bao trong một transaction (`@Transactional`).

4.  **Tạo Repositories:**
    *   `PrescriptionRepository` (extends `JpaRepository`).
    *   `PrescriptionItemRepository` (extends `JpaRepository`).

## Công nghệ sử dụng

*   **Framework:** Spring Boot (`spring-web`, `spring-data-jpa`, `spring-boot-starter-validation`)
*   **Transaction Management:** `@Transactional`

## Kết quả mong đợi

*   Endpoint `POST /api/v1/prescriptions` hoạt động, cho phép tạo một đơn thuốc hoàn chỉnh.
*   Dữ liệu được lưu chính xác vào các bảng `PRESCRIPTION` và `PRESCRIPTION_ITEM`.
*   Trạng thái ban đầu của đơn thuốc luôn là `PENDING_PAYMENT`.
*   Luồng xử lý có khả năng rollback nếu có lỗi xảy ra giữa chừng.