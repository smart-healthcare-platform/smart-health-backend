# Chatbot Service

## Overview

This is the Chatbot Service Core implementation for the healthcare chatbot system. It provides REST API endpoints for chat interactions and health monitoring.

## Prerequisites

- Node.js 18+
- Docker (for running dependent services)
- PostgreSQL database
- Redis cache

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Then update the values in `.env` as needed.

3. Start dependent services using Docker:
   ```bash
   docker-compose up -d
   ```

## Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check service health status

### Chat
- `POST /api/chat` - Send a message to the chatbot

Example request:
```json
{
  "message": "Hello, how are you?",
  "userId": "user_123",
  "language": "en"
}
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Linting

Check for linting issues:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Code Formatting

Format code with Prettier:
```bash
npm run format
```

## Testing the Service

You can test the service functionality using the provided test scripts:

### On Windows:
```cmd
test-service.bat
```

### On Unix/Linux/Mac:
```bash
./test-service.sh
```

These scripts will run several tests including:
- Health endpoint test
- Chat endpoint with valid data
- Chat endpoint with missing required fields
- Chat endpoint with empty message