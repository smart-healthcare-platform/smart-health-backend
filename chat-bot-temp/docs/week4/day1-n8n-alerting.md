# Tuần 4, Ngày 1: Tích hợp Cảnh báo Khẩn cấp (n8n MVP)

## 🎯 Mục tiêu

- Thiết lập một workflow đơn giản trên n8n để nhận cảnh báo.
- Tích hợp việc gọi cảnh báo từ `chatService` khi một rule khẩn cấp được kích hoạt.

## 🛠️ Tasks chi tiết

### 1. Thiết lập n8n Service và Workflow
- **Công cụ:** Docker, n8n UI.
- **Nhiệm vụ:**
    - Đảm bảo service `n8n` trong `docker-compose.yml` đang chạy.
    - Truy cập vào dashboard của n8n (thường là `http://localhost:5678`).
    - Tạo một workflow mới.
    - Kéo node "Webhook" vào làm trigger. N8n sẽ tự động tạo một URL cho webhook này.
    - Kéo một node "Logger" (hoặc một node gửi request đến một dịch vụ log) để ghi lại thông tin nhận được từ webhook. Đây là phiên bản MVP, trong thực tế có thể là node gửi SMS, email, v.v.
    - Lưu và kích hoạt (activate) workflow.

### 2. Cập nhật `chatService.js` để gọi Webhook
- **File:** `src/services/chatService.js`
- **Thư viện:** `axios` hoặc `node-fetch` để thực hiện HTTP request.
- **Trọng tâm:**
    - Trong luồng xử lý `handleRuleBasedResponse`, kiểm tra xem action của rule có phải là loại "redirect" hoặc có `urgency` ở mức `CRITICAL` hay không.
    - Nếu có, tạo một payload chứa thông tin cảnh báo (ví dụ: `userId`, `message`, `ruleId`).
    - Thực hiện một `POST` request đến URL của webhook n8n đã tạo ở bước 1, gửi kèm payload.
    - Việc gọi webhook nên được thực hiện bất đồng bộ (không `await`) để không làm chậm quá trình trả lời người dùng.

### 3. Cấu hình Biến môi trường
- **File:** `.env`
- **Nhiệm vụ:**
    - Thêm một biến môi trường mới `N8N_EMERGENCY_WEBHOOK_URL` và gán giá trị là URL của webhook đã tạo.
    - Đảm bảo `chatService` đọc và sử dụng biến môi trường này.

### 4. Testing
- **Công cụ:** Postman/curl, n8n UI.
- **Kịch bản:**
    - Gửi một tin nhắn khẩn cấp đến `/api/chat`.
    - Kiểm tra xem `chatService` có trả về response cho người dùng không.
    - Đồng thời, kiểm tra trong dashboard của n8n xem workflow có được kích hoạt và nhận được đúng dữ liệu hay không.

## ✅ Success Criteria
- [ ] Workflow trên n8n được tạo và kích hoạt thành công.
- [ ] `chatService` có thể gọi đến webhook của n8n khi có cảnh báo khẩn cấp.
- [ ] Dữ liệu cảnh báo được gửi đi chính xác.
- [ ] Toàn bộ luồng hoạt động end-to-end.