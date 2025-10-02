# Kế hoạch phát triển Chat Service: Ngày 2

**Mục tiêu:** Xây dựng server, tích hợp Socket.IO và triển khai lớp xác thực bảo mật.

---

### 1. Xây dựng Express Server cơ bản (Ước tính: 2 giờ)
- **Công việc:**
  - Trong `src/app.ts`, khởi tạo một ứng dụng Express.
  - Cấu hình các middleware cơ bản: `cors`, `helmet`, `express.json()`.
  - Tạo một route health check (`/health`) để kiểm tra tình trạng hoạt động của service.
  - Tích hợp HTTP server của Node.js để có thể gắn Socket.IO vào.
- **Kết quả mong đợi:** Một Express server chạy được trên một cổng nhất định và trả về thành công cho route `/health`.

### 2. Tích hợp Socket.IO (Ước tính: 2 giờ)
- **Công việc:**
  - Gắn Socket.IO vào HTTP server đã tạo.
  - Tạo một tệp `sockets/index.ts` để quản lý logic chính của Socket.IO.
  - Thiết lập các trình xử lý sự kiện (event handler) cơ bản cho `connection` và `disconnect`.
  - Log ra console khi một client kết nối hoặc ngắt kết nối để kiểm tra.
- **Kết quả mong đợi:** Client có thể kết nối tới Socket.IO server và log được ghi nhận ở phía server.

### 3. Triển khai Middleware xác thực JWT (Ước tính: 4 giờ)
- **Công việc:**
  - Viết một middleware cho Socket.IO (`socket.auth.ts`).
  - Middleware này sẽ lấy JWT từ handshake request của client (`socket.handshake.auth.token`).
  - Giải mã token bằng `jsonwebtoken`.
  - **Quan trọng:** Logic xác thực token có thể cần gọi đến `Auth Service` để đảm bảo token vẫn hợp lệ và người dùng tồn tại. (Tạm thời có thể mock logic này nếu `Auth Service` chưa sẵn sàng).
  - Nếu token hợp lệ, gắn thông tin người dùng (ví dụ: `userId`) vào đối tượng `socket` để sử dụng ở các bước sau.
  - Nếu token không hợp lệ, từ chối kết nối và gửi lỗi về cho client.
- **Kết quả mong đợi:** Chỉ những client có JWT hợp lệ mới có thể thiết lập kết nối WebSocket thành công. Các kết nối không hợp lệ sẽ bị từ chối.