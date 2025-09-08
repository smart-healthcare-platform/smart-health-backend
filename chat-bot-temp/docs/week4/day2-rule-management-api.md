# Tuần 4, Ngày 2: Xây dựng API Quản lý Rule

## 🎯 Mục tiêu

- Hoàn thiện các API endpoint để quản lý (CRUD) các rule trong hệ thống.
- Tích hợp cơ chế xác thực và phân quyền cơ bản cho các API này.

## 🛠️ Tasks chi tiết

### 1. Implement các API Endpoint cho Rule
- **File:** `src/routes/rules.js`
- **Logic:** Dựa theo `week2/day4-integration-testing.md`.
- **Nhiệm vụ:**
    - **`GET /api/rules`**: Lấy danh sách tất cả các rule (chỉ các trường thông tin cơ bản).
    - **`GET /api/rules/:id`**: Lấy chi tiết một rule theo ID.
    - **`POST /api/rules`**: Tạo một rule mới. Body của request phải chứa đầy đủ thông tin của rule.
    - **`PUT /api/rules/:id`**: Cập nhật một rule đã có.
    - **`DELETE /api/rules/:id`**: Xóa một rule.

### 2. Tích hợp Validation
- **File:** `src/routes/rules.js`
- **Logic:**
    - Trước khi tạo hoặc cập nhật một rule, gọi `MedicalRuleValidator.validateMedicalRule()` để kiểm tra tính hợp lệ của dữ liệu.
    - Nếu validation thất bại, trả về lỗi `400 Bad Request` với chi tiết lỗi.
    - Thêm cơ chế kiểm tra an toàn `validateRuleSafety` để tránh các rule có thể gây nguy hiểm.

### 3. Thêm Middleware Xác thực (Placeholder)
- **File:** `src/routes/rules.js`
- **Nhiệm vụ:**
    - Tạo một middleware đơn giản, ví dụ `authMiddleware.js`, để mô phỏng việc xác thực.
    - Trong phiên bản MVP, middleware này có thể chỉ cần kiểm tra một API key tĩnh trong header (ví dụ: `X-Admin-API-Key`).
    - Áp dụng middleware này cho các endpoint `POST`, `PUT`, `DELETE` của `/api/rules` để chỉ "admin" mới có thể thay đổi rule.

### 4. Cập nhật `app.js`
- **File:** `src/app.js`
- **Nhiệm vụ:**
    - Đảm bảo router cho `/api/rules` được đăng ký và sử dụng trong ứng dụng Express.

### 5. Viết Integration Tests cho API
- **File:** `tests/integration/rules-api.test.js`
- **Kịch bản:**
    - Test việc tạo một rule mới thành công.
    - Test việc tạo một rule với dữ liệu không hợp lệ và nhận về lỗi 400.
    - Test việc lấy danh sách và chi tiết rule.
    - Test việc cập nhật và xóa rule.
    - Test việc truy cập các API private mà không có API key và nhận về lỗi 401/403.

## ✅ Success Criteria
- [ ] Tất cả các endpoint CRUD cho rule hoạt động đúng như mong đợi.
- [ ] Validation được tích hợp và hoạt động hiệu quả.
- [ ] Middleware xác thực cơ bản được áp dụng.
- [ ] Integration tests cho API rule đều pass.