# Kế hoạch triển khai Notification Service - Ngày 5

**Mục tiêu:** Hoàn thiện dịch vụ, tập trung vào độ tin cậy, khả năng bảo trì và xử lý lỗi.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Triển khai Logging (2.5 giờ)**
    -   Cài đặt một thư viện logging như `winston` hoặc sử dụng logger sẵn có của NestJS (`@nestjs/common`).
    -   Thêm log chi tiết cho các bước quan trọng:
        -   Khi nhận được một sự kiện từ Kafka.
        -   Trước khi gửi một thông báo qua một kênh cụ thể.
        -   Khi gửi thành công (bao gồm ID của thông báo từ nhà cung cấp dịch vụ).
        -   Khi có lỗi xảy ra (bao gồm chi tiết lỗi).
    -   Đảm bảo log có định dạng JSON để dễ dàng phân tích trên các hệ thống như ELK Stack hoặc Datadog.

2.  **Xử lý lỗi và Retry (3 giờ)**
    -   Bọc logic gửi thông báo (email, push, sms) trong khối `try...catch`.
    -   Khi một API của nhà cung cấp dịch vụ thất bại (ví dụ: do lỗi mạng, API key không hợp lệ), hệ thống phải log lại lỗi một cách rõ ràng.
    -   Triển khai một cơ chế retry đơn giản cho các lỗi có thể tạm thời (ví dụ: lỗi mạng). Ví dụ: thử lại 2-3 lần với khoảng thời gian chờ tăng dần.
    -   Đối với các lỗi không thể phục hồi, publish một sự kiện lỗi (ví dụ: `notification.failed`) ra một topic Kafka riêng để các hệ thống giám sát có thể xử lý.

3.  **Tái cấu trúc và Tối ưu hóa (2.5 giờ)**
    -   Rà soát lại toàn bộ code.
    -   Tạo một `NotificationOrchestratorService` để chứa logic quyết định kênh nào sẽ được sử dụng, thay vì để logic này trong controller.
    -   Tạo các DTO (Data Transfer Object) với validation (`class-validator`, `class-transformer`) cho cả Kafka event payload và REST API body để đảm bảo dữ liệu đầu vào luôn hợp lệ.
    -   Đảm bảo các hàm đều đơn nhiệm và dễ đọc.

### Kết quả cần đạt được cuối ngày

-   Hệ thống logging hoàn chỉnh, cung cấp cái nhìn rõ ràng về hoạt động của dịch vụ.
-   Cơ chế xử lý lỗi và retry cơ bản đã được triển khai, tăng độ tin cậy của dịch vụ.
-   Codebase đã được tái cấu trúc, sạch sẽ, dễ đọc và dễ bảo trì hơn.
-   Dịch vụ đã đủ mạnh mẽ để chuẩn bị cho giai đoạn kiểm thử cuối cùng.