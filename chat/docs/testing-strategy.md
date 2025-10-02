# Chiến lược Testing cho Chat Service

## Tổng quan
Tài liệu này mô tả chiến lược testing được áp dụng cho Chat Service, bao gồm các loại test đã và đang được thực hiện để đảm bảo chất lượng và độ tin cậy của dịch vụ.

## Các loại test

### 1. Unit Tests
- **Mục tiêu**: Kiểm tra các hàm và module riêng lẻ
- **Vị trí**: `src/__tests__/unit/`
- **Các thành phần được test**:
 - Controller: `conversationController.test.ts`
  - Middleware: `socketAuthMiddleware.test.ts`
  - Xử lý logic: `messageHandler.test.ts`

### 2. Integration Tests
- **Mục tiêu**: Kiểm tra sự tương tác giữa các thành phần và hệ thống
- **Vị trí**: `src/__tests__/integration/`
- **Các thành phần được test**:
  - API: `conversationApi.test.ts`
  - Socket.IO: `socketIo.test.ts`

## Chi tiết các test

### Unit Tests

#### 1. `conversationController.test.ts`
- Kiểm tra controller xử lý API lấy danh sách cuộc trò chuyện
- Bao gồm các trường hợp:
  - Người dùng chưa xác thực
  - Lấy danh sách cuộc trò chuyện thành công
  - Xử lý lỗi từ cơ sở dữ liệu

#### 2. `socketAuthMiddleware.test.ts`
- Kiểm tra middleware xác thực JWT cho kết nối Socket.IO
- Bao gồm các trường hợp:
  - Token hợp lệ
  - Token không hợp lệ
  - Không có token
  - Lỗi từ Auth Service

#### 3. `messageHandler.test.ts`
- Kiểm tra các hàm xử lý tin nhắn được tách riêng:
  - `handleSendMessage`: Gửi tin nhắn, xác thực quyền, lưu vào DB, phát tin nhắn
  - `handleConnection`: Xử lý kết nối, join room
  - `handleDisconnect`: Xử lý ngắt kết nối
- Bao gồm các trường hợp:
  - Gửi tin nhắn thành công
  - Người dùng không có quyền trong cuộc trò chuyện
  - Lỗi khi lưu vào DB
 - Người nhận offline (gửi notification)

### Integration Tests

#### 1. `conversationApi.test.ts`
- Kiểm tra API endpoints cho cuộc trò chuyện
- Bao gồm các trường hợp:
  - Lấy danh sách cuộc trò chuyện rỗng
  - Lấy danh sách cuộc trò chuyện có dữ liệu
  - Lấy tin nhắn trong cuộc trò chuyện
  - Kiểm tra quyền truy cập (403 khi không phải là thành viên)
  - Lấy tin nhắn với cursor pagination

#### 2. `socketIo.test.ts`
- Kiểm tra chức năng thời gian thực qua Socket.IO
- Bao gồm các trường hợp:
  - Kết nối và xác thực người dùng
  - Gửi nhận tin nhắn thành công
  - Từ chối gửi tin nhắn nếu không có quyền
 - Xử lý lỗi trong quá trình gửi tin nhắn

## Mức độ bao quát

### Đã hoàn thành
- [x] Unit test cho controller
- [x] Unit test cho middleware xác thực
- [x] Unit test cho xử lý tin nhắn
- [x] Integration test cho API
- [x] Integration test cho Socket.IO
- [x] Test cho xác thực người dùng
- [x] Test cho phân quyền cuộc trò chuyện
- [x] Test cho lưu trữ tin nhắn vào DB
- [x] Test cho phát tin nhắn đến người nhận
- [x] Test cho xử lý người nhận offline

### Cần cải thiện
- [ ] Test cho các trường hợp cạnh (edge cases) phức tạp hơn
- [ ] Test hiệu năng với số lượng kết nối lớn
- [ ] Test cho xử lý đồng thời (concurrency)
- [ ] Test cho phục hồi sau lỗi hệ thống

## Kết luận
Các test hiện tại đã bao quát được các chức năng chính của Chat Service, đặc biệt là phần Socket.IO - thành phần cốt lõi xử lý giao tiếp thời gian thực. Tuy nhiên, vẫn cần tiếp tục mở rộng để bao quát các trường hợp đặc biệt và đảm bảo độ ổn định trong môi trường sản xuất.