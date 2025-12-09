# Kế hoạch phát triển Chat Service: Ngày 1

**Mục tiêu:** Thiết lập nền tảng vững chắc cho dự án, bao gồm cấu trúc dự án và cơ sở dữ liệu.

---

### 1. Khởi tạo dự án Node.js/TypeScript (Ước tính: 1.5 giờ)
- **Công việc:**
  - Sử dụng `npm init` để tạo `package.json`.
  - Cài đặt TypeScript và các-types liên quan (`@types/node`).
  - Tạo tệp `tsconfig.json` với các cấu hình cơ bản (target `ES2020`, module `commonjs`, `outDir`, `rootDir`).
  - Tạo cấu trúc thư mục ban đầu:
    ```
    chat/
    ├── src/
    │   ├── app.ts         # Entry point chính
    │   ├── config/        # Tệp cấu hình (db, env)
    │   ├── api/           # Express API (controllers, routes)
    │   ├── sockets/       # Logic xử lý Socket.IO
    │   ├── models/        # Sequelize models
    │   └── migrations/    # Sequelize migrations
    └── package.json
    ```
- **Kết quả mong đợi:** Một dự án TypeScript có thể biên dịch và chạy được.

### 2. Cài đặt Dependencies chính (Ước tính: 1 giờ)
- **Công việc:** Cài đặt các thư viện cần thiết qua `npm`.
  - **Framework & Server:** `express`, `@types/express`
  - **Real-time:** `socket.io`
  - **Database (ORM):** `sequelize`, `mysql2`
  - **Authentication:** `jsonwebtoken`, `@types/jsonwebtoken`
  - **Utilities:** `dotenv`, `cors`, `helmet`
  - **Dev Dependencies:** `nodemon`, `ts-node`, `eslint`, `prettier`
- **Kết quả mong đợi:** Tất cả các thư viện cần thiết đã được thêm vào `package.json`.

### 3. Cấu hình Sequelize và kết nối Database (Ước tính: 2 giờ)
- **Công việc:**
  - Tạo tệp cấu hình cho Sequelize (`.sequelizerc`).
  - Tạo tệp `config/database.js` để quản lý thông tin kết nối (đọc từ biến môi trường).
  - Viết một đoạn mã nhỏ để kiểm tra kết nối tới MySQL thành công.
- **Kết quả mong đợi:** Ứng dụng có thể kết nối thành công đến cơ sở dữ liệu MySQL.

### 4. Tạo và chạy Database Migrations (Ước tính: 3.5 giờ)
- **Công việc:**
  - Sử dụng `sequelize-cli` để tạo các tệp migration cho 3 bảng đã thiết kế:
    1.  `create-conversations.js`
    2.  `create-conversation-participants.js`
    3.  `create-messages.js`
  - Định nghĩa chi tiết các cột, kiểu dữ liệu, khóa chính, khóa ngoại và các ràng buộc trong từng tệp migration.
  - Chạy lệnh `sequelize-cli db:migrate` để áp dụng các thay đổi vào cơ sở dữ liệu.
- **Kết quả mong đợi:** Các bảng `Conversations`, `ConversationParticipants`, và `Messages` được tạo thành công trong MySQL với đúng cấu trúc.