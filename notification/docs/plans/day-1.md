# Kế hoạch triển khai Notification Service - Ngày 1

**Mục tiêu:** Thiết lập nền tảng vững chắc cho dự án, bao gồm cấu trúc project, Docker, và các module cơ bản.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Khởi tạo Project NestJS (1.5 giờ)**
    -   Sử dụng NestJS CLI để tạo một project mới: `nest new notification-service`.
    -   Dọn dẹp các file mặc định không cần thiết (`app.controller.spec.ts`, `app.service.ts`, `app.controller.ts`).
    -   Tạo cấu trúc thư mục ban đầu cho các module tương lai (`/modules`, `/common`, `/config`).

2.  **Thiết lập Docker (2 giờ)**
    -   Tạo `Dockerfile` để build image cho ứng dụng Node.js, tối ưu hóa cho môi trường production (multi-stage build).
    -   Tạo `docker-compose.yml` để chạy service cùng với các phụ thuộc cần thiết (ví dụ: Kafka, Zookeeper nếu cần cho môi trường dev).
    -   Tạo file `.dockerignore` để loại bỏ các file/folder không cần thiết khỏi image.

3.  **Cấu hình Môi trường (1.5 giờ)**
    -   Cài đặt `@nestjs/config`.
    -   Tạo file `.env.example` để định nghĩa tất cả các biến môi trường cần thiết (Port, Kafka brokers, SMTP credentials, etc.).
    -   Tạo một `ConfigModule` và `ConfigService` để quản lý và truy cập các biến môi trường một cách an toàn trong toàn bộ ứng dụng.

4.  **Tạo các Module cơ bản (2 giờ)**
    -   Tạo `NotificationModule` làm module chính.
    -   Bên trong `NotificationModule`, tạo `NotificationService` và `NotificationController`.
    -   Tạo một endpoint health-check đơn giản (`GET /health`) trong `NotificationController` để kiểm tra dịch vụ có đang hoạt động hay không.

5.  **Kiểm tra và Hoàn tất (1 giờ)**
    -   Chạy `docker-compose up --build` để đảm bảo ứng dụng có thể build và khởi động thành công.
    -   Sử dụng Postman hoặc `curl` để gọi endpoint `GET /health` và xác nhận nhận được phản hồi thành công.
    -   Commit toàn bộ code lên Git.

### Kết quả cần đạt được cuối ngày

-   Một project NestJS có cấu trúc rõ ràng.
-   Khả năng build và chạy ứng dụng bằng Docker Compose.
-   Hệ thống cấu hình môi trường đã sẵn sàng.
-   Một endpoint health-check hoạt động để xác minh tình trạng của service.