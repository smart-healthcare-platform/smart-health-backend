# Chat Service

Chat Service là một microservice độc lập trong hệ sinh thái "Smart Health", được thiết kế để cung cấp kênh giao tiếp an toàn, riêng tư và thời gian thực giữa bác sĩ và bệnh nhân.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Sử dụng](#sử-dụng)
- [API Endpoints](#api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Testing](#testing)
- [Docker](#docker)
- [Môi trường phát triển](#môi-trường-phát-triển)

## Tổng quan

Chat Service được xây dựng để giải quyết vấn đề giao tiếp giữa bác sĩ và bệnh nhân trong lĩnh vực chăm sóc sức khỏe. Dịch vụ này cho phép:

- Giao tiếp thời gian thực giữa bác sĩ và bệnh nhân
- Bảo mật và riêng tư tuyệt đối cho các cuộc trò chuyện
- Lưu trữ lịch sử trò chuyện để tra cứu
- Tích hợp thông báo đẩy khi người nhận offline
- Quản lý trạng thái trực tuyến/ngoại tuyến

## Kiến trúc

- **Ngôn ngữ:** TypeScript
- **Framework:** Node.js + Express.js
- **Giao tiếp thời gian thực:** Socket.IO
- **Cơ sở dữ liệu:** MySQL với Sequelize ORM
- **Xác thực:** JSON Web Token (JWT)
- **Containerization:** Docker, Docker Compose

### Cơ sở dữ liệu

Dự án sử dụng 3 bảng chính:

1. `Conversations`: Lưu trữ thông tin cuộc trò chuyện
2. `ConversationParticipants`: Quản lý thành viên trong cuộc trò chuyện (bác sĩ/bệnh nhân)
3. `Messages`: Lưu trữ tin nhắn với các thuộc tính như nội dung, loại, trạng thái đọc

## Cài đặt

### Yêu cầu hệ thống

- Node.js (>=14.x)
- npm hoặc yarn
- MySQL

### Cài đặt từ source

1. Clone repository:

```bash
git clone <repository-url>
cd chat
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Cài đặt các công cụ phát triển (nếu chưa có):

```bash
npm install -g typescript ts-node nodemon
```

## Cấu hình

Tạo file `.env` trong thư mục gốc dựa trên file `.env.example` (nếu có) hoặc sử dụng các biến môi trường sau:

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name
JWT_SECRET=your_jwt_secret
AUTH_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
CLIENT_URL=http://localhost:3000
```

## Sử dụng

### Phát triển

Chạy ứng dụng ở chế độ phát triển:

```bash
npm run dev
```

### Build

Build ứng dụng:

```bash
npm run build
```

### Production

Chạy ứng dụng đã build:

```bash
npm start
```

### Chạy với Docker

Xây dựng và chạy dịch vụ với Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

### Health Check

- `GET /health` - Kiểm tra trạng thái hoạt động của dịch vụ

### Quản lý cuộc trò chuyện

- `GET /api/conversations` - Lấy danh sách cuộc trò chuyện của người dùng (yêu cầu xác thực)
- `GET /api/conversations/:conversationId/messages` - Lấy lịch sử tin nhắn của một cuộc trò chuyện (yêu cầu xác thực)

### Xác thực

Tất cả các API yêu cầu xác thực JWT được gửi trong header `Authorization: Bearer <token>`.

## Socket.IO Events

### Kết nối

- `connection` - Sự kiện khi người dùng kết nối thành công (yêu cầu JWT trong handshake)

### Gửi nhận tin nhắn

- `sendMessage` - Gửi tin nhắn (payload: `{ conversationId, recipientId, content, contentType }`)
- `receiveMessage` - Nhận tin nhắn từ server
- `messageSent` - Phản hồi khi tin nhắn được gửi thành công
- `messageError` - Thông báo lỗi khi gửi tin nhắn

## Testing

### Unit Tests

```bash
npm run test
```

### Test cụ thể

```bash
npm run test -- src/__tests__/unit/conversationController.test.ts
```

## Docker

Dự án đã được cấu hình để chạy với Docker và Docker Compose:

- `Dockerfile`: Multi-stage build để tối ưu hóa kích thước image
- `docker-compose.yml`: Định nghĩa chat-service và mysql service

## Môi trường phát triển

Dự án sử dụng các công cụ sau:

- TypeScript cho type safety
- ESLint và Prettier cho code formatting
- Jest cho testing
- Sequelize CLI cho database migrations
- Nodemon cho phát triển tự động restart
- Axios cho HTTP requests

## Cấu trúc thư mục

```
src/
├── app.ts              # Entry point chính
├── config/             # Cấu hình (database, env)
├── api/
│   ├── controllers/    # Xử lý logic cho API
│   └── routes/         # Định nghĩa các route
├── middleware/         # Xác thực và xử lý middleware
├── models/             # Sequelize models
├── migrations/         # Database migrations
├── sockets/            # Logic xử lý Socket.IO
├── types/              # Type definitions
└── __tests__/          # Unit và integration tests
```

## Ghi chú

- Dự án đang trong quá trình phát triển theo kế hoạch 5 ngày
- Tất cả các chức năng cốt lõi đã được triển khai
- Các test đã được viết và chạy thành công
- Docker và Docker Compose đã được cấu hình
