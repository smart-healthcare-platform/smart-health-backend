# Tuần 3, Ngày 1: Hiện thực hóa Rule Engine - Parser & Compiler

## 🎯 Mục tiêu

- Implement các thành phần `RuleParser` và `RuleCompiler` dựa trên thiết kế của Tuần 2.
- Viết Unit Test để đảm bảo các thành phần này hoạt động chính xác.

## 🛠️ Tasks chi tiết

### 1. Implement `RuleParser.js`
- **File:** `src/rule-engine/parser/RuleParser.js`
- **Logic:** Dựa theo `week2/day2-core-engine-implementation.md`.
- **Trọng tâm:**
    - Triển khai đầy đủ các toán tử: `contains`, `equals`, `matches`, `greaterThan`, `lessThan`.
    - Xây dựng hàm `validateRule` để kiểm tra cấu trúc rule đầu vào.
    - Hàm `compileConditions` và `compileActions` để biến đổi rule thành các hàm có thể thực thi.

### 2. Implement `RuleCompiler.js`
- **File:** `src/rule-engine/compiler/RuleCompiler.js`
- **Logic:** Dựa theo `week2/day2-core-engine-implementation.md`.
- **Trọng tâm:**
    - Sử dụng `RuleParser` để phân tích và biên dịch rule.
    - Quản lý các rule đã được biên dịch bằng `Map` để tối ưu hóa.
    - Xử lý lỗi một cách an toàn khi một rule không hợp lệ.

### 3. Viết Unit Tests cho Parser và Compiler
- **File:** `tests/rule-engine/RuleParser.test.js`, `tests/rule-engine/RuleCompiler.test.js`
- **Kịch bản:**
    - Test `RuleParser` với các rule hợp lệ và không hợp lệ.
    - Test từng toán tử của `RuleParser` với các context khác nhau.
    - Test `RuleCompiler` với một danh sách các rule, đảm bảo nó bỏ qua các rule lỗi và biên dịch thành công các rule hợp lệ.

## ✅ Success Criteria
- [x] File `RuleParser.js` được implement đầy đủ.
- [x] File `RuleCompiler.js` được implement đầy đủ.
- [x] Unit tests cho cả hai file đạt trên 80% coverage.
- [x] Tất cả các bài test đều pass.