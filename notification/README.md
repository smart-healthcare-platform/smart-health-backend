# 🔔 Notification Service

Smart Health Notification Service - Handles push notifications via Firebase Cloud Messaging (FCM) and email notifications.

**Version:** 1.0.0  
**Port:** 8088  
**Framework:** NestJS + TypeScript

## Overview

This service is responsible for:
- 📱 Managing device tokens (FCM registration)
- 🔔 Sending push notifications to mobile/web devices
- ✉️ Sending email notifications
- 🎯 Consuming Kafka events from other services
- 🗄️ Storing device information in database

## Features

- **Device Management**: Register, deactivate, and track user devices
- **Firebase Cloud Messaging**: Send push notifications to web, iOS, and Android
- **Email Notifications**: Send transactional emails via SMTP
- **Kafka Integration**: Event-driven architecture for real-time notifications
- **Auto Token Cleanup**: Automatically deactivate invalid/expired FCM tokens
- **Multi-Device Support**: Send to all user's registered devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Kafka 2.8+
- Firebase Project with Admin SDK credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials
```

### Environment Variables

```env
# Server
PORT=8088
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_DATABASE=smart_health_notification

# Kafka
KAFKA_BROKERS=localhost:9092

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=Smart Health <noreply@smarthealth.com>
```

### Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode
npm run start:dev
```

### Verify Service is Running

```bash
# Check health endpoint
curl http://localhost:8088/api/notifications/health

# Expected response
OK
```

## 📡 API Endpoints

### Device Management

#### Register Device Token
```bash
POST /api/notifications/device/register
Content-Type: application/json

{
  "userId": "user-123",
  "deviceToken": "fcm-token-abc...",
  "deviceType": "web" | "ios" | "android"
}
```

#### Deactivate Device Token
```bash
DELETE /api/notifications/device/deactivate
Content-Type: application/json

{
  "userId": "user-123",
  "deviceToken": "fcm-token-abc..."
}
```

#### Get User's Active Devices
```bash
GET /api/notifications/:userId/devices
```

#### Deactivate All User Devices
```bash
DELETE /api/notifications/:userId/all
```

## 🎯 Kafka Events

This service consumes the following Kafka topics:

### message.new
Triggered when a chat message is sent to an offline user.

```json
{
  "recipientId": "user-123",
  "senderId": "user-456",
  "senderName": "John Doe",
  "messageContent": "Hello!",
  "conversationId": "conv-789",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### appointment.confirmed
Triggered when an appointment is confirmed.

```json
{
  "patientEmail": "patient@example.com",
  "doctorEmail": "doctor@example.com",
  "patientId": "patient-123",
  "doctorId": "doctor-456",
  "patientName": "Jane Doe",
  "doctorName": "Dr. Smith",
  "appointmentTime": "2024-01-15T14:00:00.000Z",
  "conversation": "Regular checkup"
}
```

## 🗄️ Database Schema

### user_devices

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | VARCHAR(255) | User ID |
| device_token | TEXT | FCM device token |
| device_type | ENUM | 'web', 'ios', or 'android' |
| is_active | BOOLEAN | Device active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## 🔧 Recent Fixes (2024-01)

### ✅ Fixed: 404 Not Found on Device Registration

**Problem:** API Gateway was getting 404 when calling `/api/notifications/device/register`

**Root Cause:** Notification service was missing the global prefix `/api/notifications`

**Solution:** Added global prefix in `src/main.ts`:
```typescript
app.setGlobalPrefix('api/notifications');
```

**Impact:** Device registration now works correctly via API Gateway

### ✅ Fixed: Authentication Integration

**Problem:** Frontend wasn't syncing auth tokens properly

**Solution:** Updated frontend to sync tokens between Redux and localStorage

**See:** [../docs/NOTIFICATION_FIX_SUMMARY.md](../docs/NOTIFICATION_FIX_SUMMARY.md) for complete details

## 🧪 Testing

```bash
# Unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
