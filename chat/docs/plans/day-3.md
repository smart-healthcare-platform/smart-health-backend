# Kế hoạch phát triển Chat Service: Ngày 3

**Mục tiêu:** Triển khai logic cốt lõi của tính năng chat, bao gồm gửi và nhận tin nhắn.

---

### 1. Tạo Sequelize Models (Ước tính: 2 giờ)
- **Công việc:**
  - Tạo các tệp model tương ứng với các bảng đã migrate:
    1.  `models/conversation.ts`
    2.  `models/conversationParticipant.ts`
    3.  `models/message.ts`
  - Định nghĩa các thuộc tính và mối quan hệ (associations) giữa các model:
    - `Conversation` có nhiều `Message`.
    - `Conversation` có nhiều `ConversationParticipant`.
- **Kết quả mong đợi:** Các model Sequelize được định nghĩa chính xác và sẵn sàng để tương tác với cơ sở dữ liệu.

### 2. Triển khai Logic Quản lý Phòng Chat (Ước tính: 2 giờ)
- **Công việc:**
  - Khi một người dùng kết nối thành công, truy vấn cơ sở dữ liệu để lấy danh sách các `conversationId` mà họ tham gia.
  - Sử dụng `socket.join(conversationId)` để cho người dùng tham gia vào các "room" tương ứng với mỗi cuộc trò chuyện.
  - Xử lý logic khi người dùng ngắt kết nối (`disconnect` event).
- **Kết quả mong đợi:** Người dùng được tự động thêm vào các phòng chat của họ khi kết nối, sẵn sàng để nhận tin nhắn.

### 3. Triển khai Logic Gửi và Nhận Tin nhắn (Ước tính: 4 giờ)
- **Công việc:**
  - Tạo một trình xử lý sự kiện cho `sendMessage`.
  - **Logic xử lý:**
    1.  Nhận dữ liệu từ client (ví dụ: `{ conversationId, content }`).
    2.  Xác thực rằng người gửi (`socket.data.userId`) là thành viên của `conversationId` đó.
    3.  Lưu tin nhắn mới vào bảng `Messages` trong cơ sở dữ liệu, bao gồm `senderId`, `conversationId`, và `content`.
    4.  Sử dụng `io.to(conversationId).emit('newMessage', messageData)` để gửi tin nhắn đến tất cả các thành viên trong phòng chat (bao gồm cả người gửi để xác nhận).
- **Kết quả mong đợi:** Một người dùng có thể gửi tin nhắn trong một cuộc trò chuyện và tất cả các thành viên khác trong cuộc trò chuyện đó (nếu đang online) sẽ nhận được tin nhắn ngay lập tức. Tin nhắn được lưu trữ thành công vào DB.