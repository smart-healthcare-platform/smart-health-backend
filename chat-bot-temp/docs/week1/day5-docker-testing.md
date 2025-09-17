# Day 5: Docker Configuration & Testing

## 🎯 Mục tiêu ngày 5
Hoàn thiện Docker configuration, implement automated tests, và verify end-to-end functionality của toàn bộ Chatbot Service.

## 📋 Prerequisites
- Đã hoàn thành Day 4: Database integration
- Tất cả services đang running qua docker-compose
- Application code hoàn chỉnh với tất cả endpoints
- Environment variables properly configured

## 🛠️ Tasks chi tiết

### 1. Tạo Dockerfile cho Chatbot Service
```dockerfile
# chat-bot/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S chatbot -u 1001

# Change ownership of app directory
RUN chown -R chatbot:nodejs /app
USER chatbot

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 2. Update docker-compose.yml để include Chatbot Service
```yaml
# Thêm service này vào docker-compose.yml
services:
  chatbot-service:
    build: .
    container_name: chatbot-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=database
      - DB_PORT=3306
      - DB_NAME=chatbot_db
      - DB_USER=chatbot_user
      - DB_PASSWORD=secure_password
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=redis_password
      - OLLAMA_HOST=http://ollama:11434
      - OLLAMA_MODEL=llama2:7b
      - JWT_SECRET=your_production_jwt_secret
    depends_on:
      - mysql
      - redis
      - ollama
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### 3. Tạo .dockerignore file
```dockerignore
# chat-bot/.dockerignore
node_modules
npm-debug.log*
logs
.git
.env
.nyc_output
coverage
.DS_Store
*.md
LICENSE
```

### 4. Implement automated tests
```javascript
// tests/integration/health.test.js
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Health Check API', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
  });
});
```

```javascript
// tests/integration/chat.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Chat API', () => {
  test('POST /api/chat should return 200 with valid request', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'Hello, test message',
        userId: 'test_user_001',
        language: 'en'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body).toHaveProperty('sessionId');
  });

  test('POST /api/chat should return 400 with invalid request', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        // Missing required fields
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
```

### 5. Tạo test configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    './tests/setup.js'
  ]
};
```

```javascript
// tests/setup.js
const { sequelize } = require('../src/models');

// Global test setup
beforeAll(async () => {
  // Sync test database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});
```

### 6. Tạo test scripts và documentation
```json
// package.json - thêm test scripts
{
  "scripts": {
    "test:integration": "jest tests/integration/ --verbose",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

### 7. Build và test Docker image
```bash
# Build Docker image
docker build -t chatbot-service .

# Test Docker image
docker run -p 3001:3001 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_NAME=chatbot_db \
  -e DB_USER=chatbot_user \
  -e DB_PASSWORD=secure_password \
  -e REDIS_HOST=localhost \
  -e REDIS_PORT=6379 \
  -e REDIS_PASSWORD=redis_password \
  chatbot-service

# Test với docker-compose
docker-compose up --build
```

### 8. Tạo end-to-end test script
```bash
#!/bin/bash
# tests/e2e-test.sh

echo "=== End-to-End Test ==="

# Start services
docker-compose up -d

# Wait for services to be ready
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | jq .

# Test chat endpoint
echo "Testing chat endpoint..."
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I have chest pain",
    "userId": "test_user_001",
    "language": "vi"
  }' | jq .

# Test history endpoint
echo "Testing history endpoint..."
curl -s http://localhost:3001/api/history/test_user_001 | jq .

echo "=== End-to-End Test Completed ==="

# Stop services
docker-compose down
```

### 9. Tạo documentation và setup instructions
```markdown
# chat-bot/README.md
# Chatbot Service - Setup Instructions

## Local Development

1. **Prerequisites**
   - Docker and Docker Compose
   - Node.js 18+
   - Python 3.8+

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   npm install
   npm run dev
   ```

4. **Running Tests**
   ```bash
   npm test              # Unit tests
   npm run test:integration  # Integration tests
   npm run test:coverage # Coverage report
   ```

## Production Deployment

1. **Build Docker Image**
   ```bash
   docker build -t chatbot-service .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## API Documentation

See [API.md](docs/API.md) for detailed API documentation.
```

### 10. Final verification và testing
```bash
# Run all tests
npm test
npm run test:integration

# Build and test Docker image
docker build -t chatbot-service:test .
docker run --rm chatbot-service:test npm test

# Test complete workflow
chmod +x tests/e2e-test.sh
./tests/e2e-test.sh
```

## ✅ Success Criteria
- [ ] Dockerfile created và working
- [ ] docker-compose.yml updated với chatbot service
- [ ] Automated tests implemented và passing
- [ ] Test coverage meets requirements
- [ ] End-to-end testing script working
- [ ] Documentation complete
- [ ] All tests pass trong CI environment

## 🚨 Troubleshooting Common Issues

### Docker Build Failures
```bash
# Check Docker build logs
docker build -t chatbot-service . --no-cache

# Check image size
docker images | grep chatbot-service
```

### Test Failures
```bash
# Run tests với debug output
npm test -- --verbose

# Check test coverage
npm run test:coverage
```

### Docker Compose Issues
```bash
# Check service logs
docker-compose logs chatbot-service

# Restart services
docker-compose restart
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Docker Configuration | 45 phút |
| Test Implementation | 60 phút |
| Test Configuration | 30 phút |
| End-to-End Testing | 45 phút |
| Documentation | 30 phút |
| Final Verification | 30 phút |
| **Total** | **240 phút** |

## 🎯 Week 1 Completion Checklist
- [ ] Development environment setup
- [ ] All dependencies và services running
- [ ] Core service implemented
- [ ] Database integration complete
- [ ] API endpoints working
- [ ] Docker configuration complete
- [ ] Automated tests passing
- [ ] Documentation updated
- [ ] End-to-end workflow verified

## 📈 Next Steps after Week 1
1. **Week 2 Planning**: Rule Engine implementation
2. **Week 3 Planning**: RAG System integration  
3. **Week 4 Planning**: n8n Automation setup
4. **CI/CD Pipeline**: Setup GitHub Actions
5. **Monitoring**: Implement Prometheus metrics
6. **Security**: Add authentication middleware