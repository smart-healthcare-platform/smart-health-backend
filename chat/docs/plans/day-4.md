# Kế hoạch phát triển Chat Service: Ngày 4

**Mục tiêu:** Xây dựng các API hỗ trợ để quản lý và truy xuất dữ liệu, đồng thời bắt đầu viết kiểm thử.

---

### 1. Xây dựng API để lấy danh sách cuộc trò chuyện (Ước tính: 3 giờ)
- **Công việc:**
  - Tạo một route mới trong Express: `GET /api/conversations`.
  - Viết controller để xử lý request này.
  - Logic:
    1.  Lấy `userId` từ JWT đã được xác thực.
    2.  Truy vấn cơ sở dữ liệu để tìm tất cả các `conversationId` mà người dùng này tham gia.
    3.  Lấy thông tin cơ bản của mỗi cuộc trò chuyện (ví dụ: thông tin người tham gia khác, tin nhắn cuối cùng).
  - Triển khai phân trang (pagination) để tối ưu hóa hiệu suất.
- **Kết quả mong đợi:** Client có thể gọi API này để hiển thị danh sách các cuộc trò chuyện của người dùng.

### 2. Xây dựng API để lấy lịch sử tin nhắn của một cuộc trò chuyện (Ước tính: 3 giờ)
- **Công việc:**
  - Tạo một route mới: `GET /api/conversations/:conversationId/messages`.
  - Viết controller để xử lý.
  - Logic:
    1.  Xác thực rằng người dùng có quyền truy cập vào `conversationId` này.
    2.  Truy vấn bảng `Messages` để lấy danh sách tin nhắn, sắp xếp theo thời gian.
    3.  Triển khai "infinite scroll" (tải thêm khi cuộn) bằng cách sử dụng cursor-based pagination (ví dụ: `?before=<messageId>`).
- **Kết quả mong đợi:** Client có thể tải lịch sử tin nhắn của một cuộc trò chuyện cụ thể một cách hiệu quả.

### 3. Bắt đầu viết Unit Test (Ước tính: 2 giờ)
- **Công việc:**
  - Cài đặt và cấu hình một framework kiểm thử như `Jest` và `ts-jest`.
  - Viết các unit test đầu tiên cho các chức năng không phụ thuộc nhiều vào I/O, ví dụ:
    - Các hàm tiện ích (utility functions).
    - Logic đơn giản trong các controller.
  - Mock các dependencies (như Sequelize) để cô lập đơn vị cần kiểm thử.
- **Kết quả mong đợi:** Framework kiểm thử được thiết lập và một vài unit test đầu tiên được viết và chạy thành công.