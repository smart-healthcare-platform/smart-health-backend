# Kế hoạch triển khai Notification Service - Ngày 4

**Mục tiêu:** Tích hợp kênh SMS cho các cảnh báo khẩn cấp và xây dựng REST API cho các yêu cầu thông báo đồng bộ.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Thiết lập Twilio (hoặc nhà cung cấp SMS khác) (1.5 giờ)**
    -   Đăng ký tài khoản Twilio và lấy `Account SID`, `Auth Token`, và một số điện thoại Twilio.
    -   Thêm các credentials này vào file `.env` và `ConfigService`.

2.  **Tích hợp Twilio SDK (2.5 giờ)**
    -   Cài đặt thư viện `twilio`.
    -   Tạo một `SmsService` để đóng gói logic gửi SMS.
    -   Trong `SmsService`, khởi tạo Twilio client và viết một phương thức `sendSms(to: string, body: string)`.

3.  **Xử lý sự kiện `prediction.high-risk` (2 giờ)**
    -   **Phân tích:** Sự kiện này cần chứa `userId` của người dùng đã xác thực. `Notification Service` sẽ cần một cách để lấy số điện thoại từ `userId`.
    -   **Giải pháp tạm thời:** Tạo một service giả lập (`FakePatientService`) trả về thông tin người dùng giả (bao gồm số điện thoại) dựa trên `userId`.
    -   Trong `NotificationKafkaController`, tạo phương thức lắng nghe sự kiện `prediction.high-risk`.
    -   Khi nhận sự kiện, gọi service giả lập để lấy số điện thoại, sau đó gọi `SmsService.sendSms()` để gửi cảnh báo.

4.  **Xây dựng REST API (2 giờ)**
    -   Trong `NotificationController`, tạo một endpoint `POST /notifications/send` cho các yêu cầu đồng bộ.
    -   Request body sẽ chứa các thông tin như `channel` ('email' | 'sms' | 'push'), `recipient`, và `payload`.
    -   Trong `NotificationService`, tạo một phương thức `sendSyncNotification` để xử lý logic này, gọi đến `EmailService`, `FirebaseService`, hoặc `SmsService` tương ứng.
    -   Thêm bảo mật cơ bản cho endpoint này (ví dụ: yêu cầu API key).

### Kết quả cần đạt được cuối ngày

-   `Notification Service` có khả năng gửi tin nhắn SMS qua Twilio.
-   Luồng cảnh báo rủi ro cao qua SMS đã được triển khai (với service giả lập).
-   Một REST API đã sẵn sàng để các service khác có thể gửi thông báo một cách đồng bộ.
-   Hầu hết các tính năng cốt lõi đã được định hình, sẵn sàng cho giai đoạn hoàn thiện.