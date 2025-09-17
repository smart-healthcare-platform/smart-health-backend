# Chatbot Service

## Overview

This is the Chatbot Service Core implementation for the healthcare chatbot system. It provides REST API endpoints for chat interactions, session management, and health monitoring.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- MySQL database (version 8.0+)
- Redis cache (version 7.0+)
- Ollama (for AI model inference)

## Quick Start with Docker

### Using Docker Compose

1. Clone the repository and navigate to the project directory
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` file with your configuration if needed
4. Start all services:
   ```bash
   docker-compose up -d
   ```
5. The service will be available at http://localhost:3000

### Manual Setup

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
   docker-compose up -d mysql redis ollama
   ```

4. Sync database schema:
   ```bash
   npm run db:sync
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

### Using Docker
```bash
# Build the image
docker build -t chatbot-service .

# Run the container
docker run -p 3000:3000 --env-file .env chatbot-service
```

## API Endpoints

### Health Check
- `GET /health` - Check service health status with database and Redis connectivity

### Chat
- `POST /api/chat` - Send a message to the chatbot
- `GET /api/chat/history/:userId` - Get chat history for a user
- `DELETE /api/chat/history/:userId` - Clear chat history for a user

### Session Management
- `GET /api/session/:sessionId` - Get session information
- `POST /api/session` - Create a new session
- `PUT /api/session/:sessionId` - Update session information
- `DELETE /api/session/:sessionId` - Delete a session

Example chat request:
```json
{
  "message": "Hello, how are you?",
  "userId": "user_123",
  "language": "en",
  "sessionId": "session_456"
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test with Coverage
```bash
npm run test:coverage
```

### End-to-End Tests
```bash
# Run the complete test suite
./tests/e2e-test.sh
```

### Tests in Watch Mode
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

## Database Management

### Sync Database Schema
```bash
npm run db:sync
```

### Force Sync (Drops and recreates tables)
```bash
npm run db:sync:force
```

## Docker Configuration

### Building the Docker Image
```bash
docker build -t chatbot-service .
```

### Running with Docker Compose
```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d mysql redis ollama

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Health Checks
All services include health checks. You can monitor service status using:
```bash
docker-compose ps
```

## Environment Variables

See `.env.example` for all available environment variables. Key variables include:

- `PORT`: Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: MySQL database configuration
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `OLLAMA_BASE_URL`: Ollama service URL
- `NODE_ENV`: Environment (development/production)

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── app.js           # Express app setup
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commit messages

## Support

For issues and questions, please check the documentation or create an issue in the repository.