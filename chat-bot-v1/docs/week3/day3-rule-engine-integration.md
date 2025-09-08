# Tuần 3, Ngày 3: Tích hợp Rule Engine vào Chat Service

## 🎯 Mục tiêu

- Tích hợp Rule Engine đã hoàn thiện vào `chatService`.
- Xây dựng luồng xử lý hoàn chỉnh: `chatService` nhận request, chuyển cho Rule Engine, nếu không có rule nào khớp thì fallback sang AI.

## 🛠️ Tasks chi tiết

### 1. Cập nhật `chatService.js`
- **File:** `src/services/chatService.js`
- **Logic:** Dựa theo `week2/day4-integration-testing.md`.
- **Trọng tâm:**
    - Trong hàm `initialize`, gọi `ruleService.getAllRules()` và `ruleEngine.initialize()` để nạp các rule khi service khởi động.
    - Trong hàm `processMessage`, xây dựng context object từ `messageData`.
    - Gọi `ruleEngine.evaluate(context)`.
    - Nếu `ruleResults.matchedRules.length > 0`, xử lý và trả về response dựa trên action của rule.
    - Nếu không, gọi đến hàm xử lý bằng AI (sẽ được tích hợp RAG vào ngày mai).

### 2. Tạo Medical Rule Sets cơ bản
- **File:** `scripts/generate-medical-rules.js`
- **Logic:** Dựa theo `week2/day3-medical-rule-sets.md`.
- **Trọng tâm:**
    - Viết một script để tự động tạo và thêm một vài rule y tế cơ bản (ví dụ: đau ngực, khó thở) vào bảng `rules` trong DB. Điều này cần thiết cho việc testing.
    - Chạy script này để có dữ liệu rule.

### 3. Viết Integration Test
- **File:** `tests/integration/chat.test.js`
- **Kịch bản:**
    - Test endpoint `/api/chat` với một tin nhắn khớp với rule y tế đã tạo. Mong đợi response trả về từ Rule Engine.
    - Test endpoint `/api/chat` với một tin nhắn thông thường (ví dụ: "xin chào"). Mong đợi response trả về từ AI (fallback).

## ✅ Success Criteria
- [x] `chatService.js` được cập nhật và có thể điều phối giữa Rule Engine và AI.
- [x] Có ít nhất 2-3 rule y tế trong cơ sở dữ liệu để phục vụ việc test.
- [ ] Integration test cho thấy luồng xử lý hoạt động chính xác. (Đang gặp lỗi SyntaxError trong RuleParser.js khi chạy test)
- [ ] Chạy thử ứng dụng và gửi tin nhắn qua Postman/curl cho kết quả đúng.