# Tuần 3, Ngày 2: Hiện thực hóa Rule Engine - Execution & Storage

## 🎯 Mục tiêu

- Implement các thành phần `RuleEngine` (execution) và `RuleService` (storage).
- Chạy script migration để tạo bảng `rules` trong cơ sở dữ liệu.

## 🛠️ Tasks chi tiết

### 1. Implement `RuleEngine.js`
- **File:** `src/rule-engine/engine/RuleEngine.js`
- **Logic:** Dựa theo `week2/day2-core-engine-implementation.md`.
- **Trọng tâm:**
    - Hàm `initialize` để nhận một danh sách các rule đã được biên dịch.
    - Hàm `evaluate` để kiểm tra context đầu vào với tất cả các rule.
    - Logic xử lý ưu tiên (priority) của các rule để quyết định action cuối cùng.

### 2. Implement `RuleService.js` và Model
- **File:** `src/rule-engine/storage/RuleService.js`, `src/rule-engine/storage/Rule.js`
- **Logic:** Dựa theo `week2/day1` và `day2`.
- **Trọng tâm:**
    - Định nghĩa `Rule` model bằng Sequelize.
    - Viết các hàm trong `RuleService` để thực hiện các thao tác CRUD (Create, Read, Update, Delete) với bảng `rules`.
    - Tích hợp cơ chế caching đơn giản (sử dụng `Map`) để giảm tải cho DB.

### 3. Tạo và Chạy Database Migration
- **File:** `src/utils/ruleMigrations.js`
- **Logic:** Dựa theo `week2/day1-rule-engine-architecture.md`.
- **Trọng tâm:**
    - Viết một script sử dụng `Rule.sync()` để tạo bảng trong DB.
    - Chạy script này để đảm bảo bảng `rules` được tạo thành công trong MySQL.

### 4. Viết Unit Tests
- **File:** `tests/rule-engine/RuleEngine.test.js`, `tests/rule-engine/RuleService.test.js`
- **Kịch bản:**
    - Test `RuleEngine` với các context khác nhau để đảm bảo nó trả về đúng action.
    - Mock `Rule` model và test các hàm của `RuleService`.

## ✅ Success Criteria
- [x] File `RuleEngine.js` được implement đầy đủ.
- [x] File `RuleService.js` và `Rule.js` được implement.
- [x] Bảng `rules` được tạo thành công trong MySQL.
- [ ] Unit tests cho các thành phần mới đều pass. (Thiếu Unit test cho RuleService)