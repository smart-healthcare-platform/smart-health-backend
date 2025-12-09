# Kế hoạch triển khai Notification Service - Ngày 2

**Mục tiêu:** Tích hợp Kafka và Mailer để xử lý luồng thông báo đầu tiên: Gửi email xác nhận khi một lịch hẹn được tạo.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Tích hợp Kafka (2.5 giờ)**
    -   Cài đặt các gói cần thiết: `kafkajs` và `@nestjs/microservices`.
    -   Cấu hình `KafkaModule` và tạo một `KafkaConsumerService`.
    -   Trong `main.ts`, kết nối ứng dụng với Kafka broker như một microservice để nó có thể lắng nghe các sự kiện.
    -   Định nghĩa một controller cho microservice (ví dụ: `NotificationKafkaController`) để xử lý các event đến.

2.  **Tích hợp Mailer (2 giờ)**
    -   Cài đặt `@nestjs-modules/mailer` và `handlebars`.
    -   Cấu hình `MailerModule` với các thông tin SMTP lấy từ `ConfigService`.
    -   Tạo một `EmailService` để đóng gói logic gửi mail. Service này sẽ có một phương thức như `sendAppointmentConfirmation(to: string, data: any)`.

3.  **Xử lý sự kiện `appointment.confirmed` (2 giờ)**
    -   Trong `NotificationKafkaController`, tạo một phương thức để lắng nghe sự kiện `appointment.confirmed`.
    -   Khi nhận được sự kiện, controller sẽ gọi `EmailService` để gửi mail.
    -   Tạo một file template Handlebars (`appointment-confirmation.hbs`) trong thư mục `/templates` để định dạng nội dung email.

4.  **Tái cấu trúc (Refactor) `Appointment Service` (1.5 giờ)**
    -   **Nhiệm vụ này được thực hiện ở project `appointment-service`**.
    -   Xóa bỏ `MailerModule` và logic gửi email trực tiếp.
    -   Thay vào đó, inject `ClientKafka` và publish sự kiện `appointment.confirmed` đến Kafka topic. Dữ liệu gửi kèm phải bao gồm thông tin cần thiết cho email (email bệnh nhân, tên bác sĩ, thời gian hẹn, v.v.).

### Kết quả cần đạt được cuối ngày

-   `Notification Service` có khả năng kết nối và lắng nghe sự kiện từ Kafka.
-   `Notification Service` có thể gửi email thành công bằng cách sử dụng template.
-   Luồng nghiệp vụ hoàn chỉnh: Khi một lịch hẹn được xác nhận trong `Appointment Service`, một email xác nhận sẽ được tự động gửi đến người dùng thông qua `Notification Service`.
-   `Appointment Service` đã được tái cấu trúc, gọn nhẹ hơn và không còn chứa logic gửi mail.