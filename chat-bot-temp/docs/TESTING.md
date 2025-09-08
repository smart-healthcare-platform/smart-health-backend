# Testing Documentation - Chatbot Service

## 🧪 Overview

This document provides comprehensive testing guidelines for the Chatbot Service. It covers unit testing, integration testing, performance testing, and test automation strategies to ensure software quality and reliability.

## 📊 Test Strategy

### Testing Pyramid
```
        _________        
       /         \        Manual Testing
      /           \       (5%)
     /_____________\      
    /               \     E2E Testing
   /                 \    (15%)
  /___________________\   
 /                     \  Integration Testing
/                       \ (30%)
\-----------------------/
 Integration Testing (30%)
 -----------------------
/                       \ 
\                       / Unit Testing
 \                     /  (50%)
  \___________________/
```

### Test Coverage Goals
- **Unit Tests**: ≥ 80% coverage
- **Integration Tests**: ≥ 70% coverage  
- **E2E Tests**: Critical paths only
- **Performance Tests**: All major endpoints

## 🔧 Test Environment Setup

### Local Development
```bash
# Install dependencies
npm install

# Setup test databases
docker-compose -f docker-compose.test.yml up -d

# Run migrations for test database
npm run db:migrate:test

# Seed test data
npm run db:seed:test
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,ts}'
  ]
};
```

## 🧪 Unit Testing

### Test Structure
```typescript
// src/chatbot-service/__tests__/chatbot.test.ts
import { ChatbotService } from '../chatbot-service';
import { RuleEngine } from '../../rule-engine';
import { OllamaService } from '../../ollama-service';

// Mock dependencies
jest.mock('../../rule-engine');
jest.mock('../../ollama-service');

describe('ChatbotService', () => {
  let chatbotService: ChatbotService;
  let mockRuleEngine: jest.Mocked<RuleEngine>;
  let mockOllamaService: jest.Mocked<OllamaService>;

  beforeEach(() => {
    mockRuleEngine = new RuleEngine() as jest.Mocked<RuleEngine>;
    mockOllamaService = new OllamaService() as jest.Mocked<OllamaService>;
    
    chatbotService = new ChatbotService(mockRuleEngine, mockOllamaService);
  });

  describe('processMessage', () => {
    it('should handle simple messages with rule engine', async () => {
      const message = { text: 'What are heart disease symptoms?', userId: 'test-user' };
      const mockResponse = { response: 'Common symptoms include chest pain...' };
      
      mockRuleEngine.process.mockResolvedValue(mockResponse);

      const result = await chatbotService.processMessage(message);
      
      expect(mockRuleEngine.process).toHaveBeenCalledWith(message.text);
      expect(result).toEqual(mockResponse);
    });

    it('should handle complex messages with AI service', async () => {
      const message = { 
        text: 'I have chest pain and shortness of breath, what should I do?', 
        userId: 'test-user' 
      };
      const mockResponse = { 
        response: 'These symptoms could indicate a serious condition...',
        urgency: 'HIGH'
      };
      
      mockRuleEngine.process.mockResolvedValue(null); // No rule match
      mockOllamaService.generateResponse.mockResolvedValue(mockResponse);

      const result = await chatbotService.processMessage(message);
      
      expect(mockOllamaService.generateResponse).toHaveBeenCalledWith(message.text);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty message', async () => {
      await expect(chatbotService.processMessage({ text: '', userId: 'test-user' }))
        .rejects.toThrow('Message cannot be empty');
    });
  });
});
```

### Mocking Examples
```typescript
// src/__mocks__/redis-client.ts
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  on: jest.fn()
};

// src/__mocks__/database.ts
export const mockDatabase = {
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  transaction: jest.fn()
};

// src/__mocks__/ollama-service.ts
export const mockOllamaService = {
  generateResponse: jest.fn(),
  healthCheck: jest.fn(),
  listModels: jest.fn()
};
```

## 🔗 Integration Testing

### API Integration Tests
```typescript
// tests/integration/chat-api.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { createTestUser, generateAuthToken } from '../helpers/auth-helper';

describe('Chat API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const testUser = await createTestUser();
    testUserId = testUser.id;
    authToken = generateAuthToken(testUser);
  });

  describe('POST /api/chat', () => {
    it('should process chat message successfully', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, I have chest pain',
          userId: testUserId
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('sessionId');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test message',
          userId: testUserId
        });

      expect(response.status).toBe(401);
    });

    it('should validate request payload', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### Database Integration Tests
```typescript
// tests/integration/database.test.ts
import { DatabaseService } from '../../src/database/database-service';
import { testConfig } from '../config/test-config';

describe('Database Integration Tests', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = new DatabaseService(testConfig.database);
    await dbService.connect();
  });

  afterAll(async () => {
    await dbService.disconnect();
  });

  describe('Conversation Storage', () => {
    it('should store and retrieve conversation', async () => {
      const conversationData = {
        userId: 'test-user-1',
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
          { role: 'assistant', content: 'Hi there!', timestamp: new Date() }
        ]
      };

      const savedConversation = await dbService.saveConversation(conversationData);
      expect(savedConversation).toHaveProperty('id');

      const retrieved = await dbService.getConversation(savedConversation.id);
      expect(retrieved).toEqual(savedConversation);
    });

    it('should handle concurrent conversations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        dbService.saveConversation({
          userId: `user-${i}`,
          messages: [{ role: 'user', content: `Message ${i}` }]
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
    });
  });
});
```

## 🚀 Performance Testing

### Load Testing Configuration
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users  
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    errors: ['rate<0.01'],            // Error rate < 1%
  },
};

export default function () {
  const url = 'http://localhost:3001/api/chat';
  const payload = JSON.stringify({
    message: 'Test message for performance testing',
    userId: `user-${__VU}`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
  };

  const res = http.post(url, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(res.status !== 200);
  sleep(1);
}
```

### Stress Testing
```javascript
// tests/performance/stress-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '10m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3001/health');
  
  check(res, {
    'health check is successful': (r) => 
      r.status === 200 && JSON.parse(r.body).status === 'OK'
  });
}
```

## 🧩 Test Data Management

### Factory Functions
```typescript
// tests/factories/conversation-factory.ts
export const createConversation = (overrides = {}) => ({
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  messages: [
    {
      role: 'user' as const,
      content: 'Test message',
      timestamp: new Date()
    }
  ],
  ...overrides
});

export const createUser = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
  role: 'patient' as const,
  ...overrides
});
```

### Test Data Seeding
```typescript
// tests/seed/test-data.ts
export const seedTestData = async (db: DatabaseService) => {
  // Seed users
  await db.users.insertMany([
    { id: 'test-user-1', email: 'user1@test.com', role: 'patient' },
    { id: 'test-user-2', email: 'user2@test.com', role: 'doctor' },
    { id: 'test-user-3', email: 'admin@test.com', role: 'admin' }
  ]);

  // Seed conversations
  await db.conversations.insertMany([
    {
      userId: 'test-user-1',
      messages: [
        { role: 'user', content: 'Hello', timestamp: new Date() },
        { role: 'assistant', content: 'Hi there!', timestamp: new Date() }
      ]
    }
  ]);
};
```

## 📋 Test Commands

### Package.json Scripts
```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=\"__tests__/.*\\.test\\.(js|ts)$\" --coverage",
    "test:integration": "jest --testPathPattern=\"tests/integration/.*\\.test\\.(js|ts)$\"",
    "test:e2e": "jest --testPathPattern=\"tests/e2e/.*\\.test\\.(js|ts)$\"",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:coverage": "npm run test:unit -- --coverage --collectCoverageFrom='src/**/*.{js,ts}'",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:watch": "jest --watch",
    "test:debug": "jest --inspect-brk"
  }
}
```

### Docker Test Environment
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: mysql:8
    environment:
      POSTGRES_DB: chatbot_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"

  test-redis:
    image: redis:6-alpine
    ports:
      - "6380:6379"

  test-ollama:
    image: ollama/ollama:latest
    ports:
      - "11435:11434"
```

## 📊 Test Reporting

### Coverage Reporting
```yaml
# .nycrc.yml
reporter:
  - html
  - text
  - lcov

check-coverage: true
branches: 80
functions: 80
lines: 80
statements: 80

exclude:
  - '**/__tests__/**'
  - '**/__mocks__/**'
  - '**/*.d.ts'
  - 'dist/**'
  - 'coverage/**'
```

### CI/CD Integration
```yaml
# GitHub Actions
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          POSTGRES_DB: chatbot_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - run: npm ci
    - run: npm run test:ci
    - run: npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 🐛 Debugging Tests

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

### Common Test Issues
```bash
# Timeout issues
jest --testTimeout=30000

# Memory issues
node --max-old-space-size=4096 node_modules/.bin/jest

# Debug specific test
jest --testNamePattern="should process chat message"
```

## 📝 Test Checklist

### Pre-commit Checklist
- [ ] All unit tests passing
- [ ] Test coverage ≥ 80%
- [ ] No linting errors
- [ ] Integration tests passing
- [ ] Performance benchmarks met

### Release Checklist  
- [ ] All test types passing
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Documentation updated
- [ ] Rollback plan tested

---
*Last updated: January 2024*
*Testing Framework: Jest + Supertest + k6*