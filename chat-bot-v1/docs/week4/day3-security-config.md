# Tuần 4, Ngày 3: Cải thiện Bảo mật và Cấu hình

## 🎯 Mục tiêu

- Rà soát và cải thiện các khía cạnh bảo mật cơ bản của ứng dụng.
- Chuẩn hóa việc quản lý cấu hình và biến môi trường.

## 🛠️ Tasks chi tiết

### 1. Quản lý Biến môi trường
- **File:** `.env`, `.env.example`
- **Thư viện:** `dotenv`
- **Nhiệm vụ:**
    - Tạo file `.env.example` từ file `.env` hiện tại.
    - Xóa tất cả các giá trị nhạy cảm trong `.env.example` và thay bằng mô tả (ví dụ: `N8N_EMERGENCY_WEBHOOK_URL=your_webhook_url_here`).
    - Đảm bảo file `.gitignore` có chứa `.env` để không commit file này lên git.
    - Viết một module `config.js` để quản lý việc đọc và xác thực các biến môi trường khi ứng dụng khởi động. Nếu thiếu biến quan trọng, ứng dụng nên báo lỗi và thoát.

### 2. Thêm các Security Headers cơ bản
- **File:** `src/app.js`
- **Thư viện:** `helmet`
- **Nhiệm vụ:**
    - Cài đặt thư viện `helmet`.
    - Sử dụng `app.use(helmet())` trong `app.js` để tự động thêm các HTTP header bảo mật (như `X-Content-Type-Options`, `Strict-Transport-Security`, v.v.).

### 3. Cấu hình CORS
- **File:** `src/app.js`
- **Thư viện:** `cors`
- **Nhiệm vụ:**
    - Cài đặt thư viện `cors`.
    - Cấu hình CORS để chỉ cho phép các domain được tin tưởng (ví dụ: domain của ứng dụng frontend) có thể gọi đến API.
    - Trong môi trường development, có thể cho phép tất cả, nhưng trong production thì phải cấu hình chặt chẽ.

### 4. Rà soát Code và Dependencies
- **Công cụ:** `npm audit`, `Snyk` (nếu có thể).
- **Nhiệm vụ:**
    - Chạy `npm audit` để kiểm tra các lỗ hổng bảo mật trong các thư viện đã cài đặt.
    - Chạy `npm audit fix` để tự động sửa các lỗi có thể.
    - Đọc qua code một lượt để đảm bảo không có thông tin nhạy cảm (API key, password) bị hardcode.

## ✅ Success Criteria
- [ ] File `.env.example` được tạo và chuẩn hóa.
- [ ] File `.env` đã được thêm vào `.gitignore`.
- [ ] Ứng dụng sử dụng `helmet` để tăng cường bảo mật.
- [ ] CORS được cấu hình đúng cách.
- [ ] `npm audit` không báo cáo lỗ hổng nghiêm trọng (critical).