# Tuần 4, Ngày 5: Kiểm thử Cuối cùng và Hoàn thiện Tài liệu

## 🎯 Mục tiêu

- Thực hiện kiểm thử toàn diện (End-to-End) cho phiên bản MVP.
- Hoàn thiện các tài liệu quan trọng để bàn giao và hỗ trợ người dùng/nhà phát triển khác.

## 🛠️ Tasks chi tiết

### 1. Tạo Kịch bản Test Thủ công
- **File:** `MANUAL-TEST.md`
- **Nhiệm vụ:**
    - Viết ra 5-7 kịch bản kiểm thử chi tiết từ góc độ người dùng.
    - Mỗi kịch bản bao gồm: Mục tiêu, Các bước thực hiện, Kết quả mong đợi.
    - **Ví dụ kịch bản:**
        1.  **Kịch bản Rule khẩn cấp:** Gửi tin nhắn chứa "đau ngực và khó thở".
        2.  **Kịch bản RAG:** Hỏi một câu về "cách phòng chống bệnh tim mạch".
        3.  **Kịch bản AI Fallback:** Hỏi "thời tiết hôm nay thế nào".
        4.  **Kịch bản Lịch sử chat:** Gửi vài tin nhắn, sau đó gọi API `/api/history/:userId` để kiểm tra.
        5.  **Kịch bản Quản lý Rule:** Dùng Postman để tạo một rule mới.

### 2. Thực hiện End-to-End Testing
- **Công cụ:** Postman, `curl`, và ứng dụng thực tế (nếu có).
- **Nhiệm vụ:**
    - Khởi động toàn bộ hệ thống.
    - Thực hiện tất cả các kịch bản trong `MANUAL-TEST.md`.
    - Ghi nhận lại tất cả các lỗi hoặc sai khác so với kết quả mong đợi.
    - Dành thời gian để sửa các lỗi "last-minute" được phát hiện.

### 3. Cập nhật Tài liệu
- **File:** `README.md`
- **Nhiệm vụ:**
    - Thêm một mục **"Quick Start"** hoặc **"Getting Started"** vào đầu file.
    - Mục này nên tóm tắt các bước đơn giản nhất để một nhà phát triển có thể clone repo, cấu hình `.env`, và chạy `docker-compose up` để khởi động dự án.
- **File:** `chat-bot/docs/API.md`
- **Nhiệm vụ:**
    - Rà soát lại tài liệu API, đảm bảo nó khớp với implementation hiện tại (đặc biệt là các API của `/api/rules`).

### 4. Dọn dẹp Code và Bàn giao
- **Công cụ:** Git
- **Nhiệm vụ:**
    - Rà soát lại code, xóa các file không cần thiết, các đoạn code đã comment.
    - Đảm bảo tất cả các thay đổi đã được commit và push lên repository.
    - Tạo một tag mới cho phiên bản MVP, ví dụ: `v1.0.0-mvp`.

## ✅ Success Criteria
- [ ] File `MANUAL-TEST.md` được tạo và tất cả kịch bản đều pass.
- [ ] `README.md` được cập nhật với hướng dẫn Quick Start.
- [ ] Tài liệu API được cập nhật.
- [ ] Codebase sạch sẽ và sẵn sàng để bàn giao.
- [ ] **Hoàn thành mục tiêu của 2 tuần tối ưu hóa!**