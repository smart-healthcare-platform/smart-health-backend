# Kafka Configuration for Chat Service

## Overview
Chat service sử dụng Kafka để publish events khi có tin nhắn mới và người nhận đang offline. Notification service sẽ consume các events này và gửi push notifications.

## Architecture

```
Chat Service (Producer)
    ↓
  Kafka Topic: "message.new"
    ↓
Notification Service (Consumer)
    ↓
  FCM Push Notification (Web/Mobile)
```

## Setup

### 1. Environment Variables

Thêm vào file `.env`:

```env
# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=chat-service

# Existing variables...
```

### 2. Install Dependencies

```bash
npm install kafkajs@^2.2.4
```

### 3. Kafka Producer Service

- **File**: `chat-producer.service.ts`
- **Pattern**: Singleton pattern để đảm bảo chỉ có 1 instance producer
- **Methods**:
  - `connect()`: Kết nối đến Kafka broker
  - `publishNewMessageEvent()`: Publish event khi có tin nhắn mới
  - `disconnect()`: Ngắt kết nối (gọi khi shutdown)

## Event Schema

### Topic: `message.new`

```typescript
{
  recipientId: string;        // User ID của người nhận
  senderId: string;           // User ID của người gửi
  senderName: string;         // Tên hiển thị của người gửi
  messageContent: string;     // Nội dung tin nhắn
  conversationId: string;     // ID của cuộc hội thoại
  timestamp: string;          // ISO timestamp
}
```

## Usage

### In Message Handler

```typescript
import { chatProducer } from '../kafka/chat-producer.service';

// Check if recipient is offline
const recipientSockets = await io.in(recipientId).fetchSockets();
if (recipientSockets.length === 0) {
  // Publish Kafka event
  await chatProducer.publishNewMessageEvent({
    recipientId,
    senderId,
    senderName,
    messageContent,
    conversationId,
  });
}
```

## Lifecycle

### Startup
- Producer được khởi tạo trong `app.ts` khi server start
- Tự động connect đến Kafka broker

### Shutdown
- Graceful shutdown handlers (`SIGTERM`, `SIGINT`) sẽ disconnect producer
- Đảm bảo tất cả messages được flush trước khi tắt

## Monitoring

### Logs

```
[Kafka Producer] Chat service producer connected successfully
[Kafka Producer] Published message.new event for recipient <userId>
[Kafka Producer] Chat service producer disconnected
```

### Error Handling

- Nếu Kafka không available, error sẽ được log nhưng không block message sending
- Chat vẫn hoạt động bình thường qua Socket.IO
- Notification chỉ bị miss cho offline users

## Testing

### Local Testing

1. Start Kafka:
```bash
docker-compose -f docker-compose-kafka.yml up -d
```

2. Check topic messages:
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic message.new \
  --from-beginning
```

## Migration Notes

### Before (Old Implementation)
- HTTP call trực tiếp đến notification service
- Tight coupling giữa services
- Sync call có thể gây delay

### After (Current Implementation)
- Kafka event-driven architecture
- Loose coupling, scalable
- Async, non-blocking
- Consistent với các services khác (appointment, doctor, patient)