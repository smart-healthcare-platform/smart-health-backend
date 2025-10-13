# Kế hoạch triển khai Notification Service - Ngày 6

**Mục tiêu:** Đảm bảo chất lượng dịch vụ thông qua kiểm thử toàn diện và hoàn tất tài liệu cần thiết trước khi bàn giao.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Viết Unit Test (3 giờ)**
    -   Sử dụng Jest (được tích hợp sẵn trong NestJS).
    -   Viết unit test cho các service chính:
        -   `NotificationOrchestratorService`: Mock các dispatcher (Email, Push, SMS) và kiểm tra xem service có gọi đúng dispatcher với đúng dữ liệu hay không.
        -   `EmailService`, `FirebaseService`, `SmsService`: Mock các SDK của bên thứ ba và kiểm tra xem service có gọi đúng phương thức của SDK với tham số chính xác hay không.
    -   Đảm bảo độ bao phủ mã nguồn (code coverage) cho các logic quan trọng đạt trên 80%.

2.  **Viết Test Tích hợp (Integration Test) (3 giờ)**
    -   Viết test cho `NotificationKafkaController`: Gửi một sự kiện giả lập đến Kafka và kiểm tra xem service có xử lý và gọi đến mock service tương ứng hay không.
    -   Viết test cho `NotificationController` (REST API): Sử dụng `supertest` để gọi đến endpoint `POST /notifications/send` và xác minh rằng nó trả về response đúng và đã gọi đến mock service phù hợp.

3.  **Kiểm thử Đầu cuối (End-to-End Testing) (1 giờ)**
    -   Thực hiện kiểm thử thủ công cho 1-2 luồng quan trọng nhất trên môi trường staging (nếu có) hoặc môi trường dev.
    -   Ví dụ: Chạy `Appointment Service` và `Notification Service` cùng lúc, tạo một lịch hẹn mới và kiểm tra xem email có thực sự được gửi đi hay không.

4.  **Hoàn thiện Tài liệu (1 giờ)**
    -   Rà soát lại các tệp trong `Memory Bank` (`architecture.md`, `tech.md`, v.v.) và cập nhật nếu có bất kỳ thay đổi nào trong quá trình triển khai.
    -   Viết một file `README.md` rõ ràng cho project, hướng dẫn cách cài đặt, cấu hình và khởi chạy dịch vụ.
    -   Tài liệu hóa các endpoint API bằng Swagger (sử dụng `@nestjs/swagger`).

### Kết quả cần đạt được cuối ngày

-   Bộ test tự động (unit và integration) đã được hoàn thành, đảm bảo chất lượng và giúp cho việc bảo trì trong tương lai dễ dàng hơn.
-   Các luồng nghiệp vụ chính đã được kiểm thử và xác nhận hoạt động đúng.
-   Tài liệu dự án đầy đủ, sẵn sàng để bàn giao cho các thành viên khác trong nhóm.
-   **Dịch vụ đã hoàn thiện và sẵn sàng để được triển khai lên môi trường production.**