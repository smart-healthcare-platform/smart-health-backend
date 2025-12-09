# Kế hoạch phát triển Chat Service: Ngày 5

**Mục tiêu:** Hoàn thiện kiểm thử, container hóa ứng dụng và chuẩn bị cho việc triển khai.

---

### 1. Viết Integration Test (Ước tính: 4 giờ)
- **Công việc:**
  - Thiết lập một cơ sở dữ liệu riêng cho việc kiểm thử.
  - Viết các integration test cho các luồng hoàn chỉnh:
    1.  **Luồng API:** Gửi request đến các endpoint API và kiểm tra kết quả trả về từ cơ sở dữ liệu.
    2.  **Luồng Socket.IO:** Sử dụng một client Socket.IO giả lập (`socket.io-client`) để kết nối, gửi tin nhắn và xác nhận rằng các sự kiện được phát ra một cách chính xác.
  - Kiểm tra các trường hợp thành công và thất bại (ví dụ: gửi tin nhắn vào cuộc trò chuyện không tồn tại, truy cập dữ liệu không được phép).
- **Kết quả mong đợi:** Các luồng nghiệp vụ chính được kiểm thử end-to-end, đảm bảo tính đúng đắn và sự ổn định.

### 2. Tạo Dockerfile và Docker Compose (Ước tính: 3 giờ)
- **Công việc:**
  - Viết một `Dockerfile` đa giai đoạn (multi-stage build) để tối ưu hóa kích thước image:
    - Giai đoạn `build`: Cài đặt dependencies và biên dịch mã TypeScript.
    - Giai đoạn `production`: Chỉ sao chép các tệp đã biên dịch và `node_modules` cần thiết cho production.
  - Tạo một tệp `docker-compose.yml` để định nghĩa `chat-service` và một service `mysql` phụ thuộc.
  - Cấu hình biến môi trường và network để hai service có thể giao tiếp với nhau.
- **Kết quả mong đợi:** Có thể khởi chạy toàn bộ `Chat Service` và cơ sở dữ liệu của nó chỉ bằng một lệnh `docker-compose up`.

### 3. Dọn dẹp mã nguồn và Viết tài liệu (Ước tính: 1 giờ)
- **Công việc:**
  - Rà soát lại toàn bộ mã nguồn, áp dụng linter và formatter.
  - Thêm các comment (JSDoc) cho các hàm và module quan trọng.
  - Cập nhật tệp `README.md` với các hướng dẫn về cách cài đặt, cấu hình và khởi chạy dự án.
- **Kết quả mong đợi:** Mã nguồn sạch sẽ, dễ đọc và có tài liệu hướng dẫn rõ ràng cho các nhà phát triển khác.