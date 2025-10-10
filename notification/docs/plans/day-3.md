# Kế hoạch triển khai Notification Service - Ngày 3

**Mục tiêu:** Tích hợp Firebase Cloud Messaging (FCM) để gửi Push Notification, xử lý luồng thông báo khi có tin nhắn mới.

---

### Nhiệm vụ chi tiết (Tasks)

1.  **Thiết lập Firebase (1.5 giờ)**
    -   Tạo một project mới trên [Firebase Console](https://console.firebase.google.com/).
    -   Vào "Project settings" -> "Service accounts" và tạo một private key mới (file JSON).
    -   Lưu trữ nội dung file JSON này một cách an toàn, ví dụ như trong biến môi trường `FIREBASE_CREDENTIALS`.

2.  **Tích hợp Firebase Admin SDK (2.5 giờ)**
    -   Cài đặt thư viện `firebase-admin`.
    -   Tạo một `FirebaseModule` và `FirebaseService`.
    -   Trong `FirebaseService`, khởi tạo Firebase Admin SDK bằng credentials đã lưu ở bước trên.
    -   Viết một phương thức `sendPushNotification(deviceToken: string, title: string, body: string)` để đóng gói logic gửi push notification.

3.  **Lưu trữ Device Token (Thiết kế & Giả định) (1 giờ)**
    -   **Phân tích:** Để gửi push notification, chúng ta cần biết `deviceToken` của người dùng. Thông tin này cần được lưu trữ ở một nơi nào đó, ví dụ như trong `Patient Service` hoặc `Auth Service`.
    -   **Giả định:** Trong ngày hôm nay, chúng ta sẽ giả định rằng khi nhận được sự kiện `message.new`, nó sẽ chứa sẵn `deviceToken` của người nhận. Việc triển khai logic lưu trữ `deviceToken` sẽ được thực hiện sau.

4.  **Xử lý sự kiện `message.new` (3 giờ)**
    -   Trong `NotificationKafkaController`, tạo một phương thức mới để lắng nghe sự kiện `message.new` từ `Chat Service`.
    -   Sự kiện này cần chứa các thông tin: `recipientDeviceToken`, `senderName`, và `messageContent`.
    -   Khi nhận được sự kiện, gọi `FirebaseService.sendPushNotification()` để gửi thông báo đến thiết bị của người nhận.

### Kết quả cần đạt được cuối ngày

-   `Notification Service` có khả năng kết nối và xác thực với Firebase.
-   `Notification Service` có thể gửi push notification đến một device token cụ thể.
-   Luồng nghiệp vụ thông báo tin nhắn mới đã được triển khai (dựa trên giả định có sẵn `deviceToken`).
-   Sẵn sàng cho việc tích hợp luồng SMS và REST API vào ngày tiếp theo.