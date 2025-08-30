
# Day 4: Integration & Testing

## 🎯 Mục tiêu ngày 4
Tích hợp Rule Engine với Chatbot Service core, implement comprehensive testing, và verify end-to-end functionality.

## 📋 Prerequisites
- Đã hoàn thành Day 3: Medical rule sets developed
- Core chat service từ Week 1 running
- Rule engine core components working
- Test infrastructure setup

## 🛠️ Tasks chi tiết

### 1. Rule Engine Integration với Chat Service
```javascript
// src/services/chatService.js (Updated)
const RuleEngine = require('../rule-engine/engine/RuleEngine');
const RuleService = require('../rule-engine/storage/RuleService');
const logger = require('../utils/logger');

class ChatService {
  constructor() {
    this.ruleEngine = new RuleEngine();
    this.ruleService = new RuleService();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load all enabled rules
      const rules = await this.ruleService.getAllRules();
      await this.ruleEngine.initialize(rules);
      
      this.isInitialized = true;
      logger.info('ChatService initialized with Rule Engine');
    } catch (error) {
      logger.error('Failed to initialize ChatService:', error);
      throw error;
    }
  }

  async processMessage(messageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const context = {
      message: {
        text: messageData.message,
        language: messageData.language || 'vi'
      },
      user: {
        id: messageData.userId,
        sessionId: messageData.sessionId
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Evaluate rules against message context
      const ruleResults = await this.ruleEngine.evaluate(context);
      
      let response;
      
      if (ruleResults.matchedRules.length > 0) {
        // Use rule-based response
        response = this.handleRuleBasedResponse(ruleResults, context);
      } else {
        // Fallback to AI model
        response = await this.handleAIFallback(messageData, context);
      }

      // Store conversation history
      await this.storeConversation(messageData, response, ruleResults);

      return {
        response: response.message,
        sessionId: messageData.sessionId,
        urgency: response.urgency,
        ruleMatches: ruleResults.matchedRules.map(r => r.ruleName),
        executionTime: ruleResults.executionTime
      };

    } catch (error) {
      logger.error('Message processing failed:', error);
      return this.handleErrorResponse(error, messageData);
    }
  }

  handleRuleBasedResponse(ruleResults, context) {
    // Get highest priority action
    const primaryAction = ruleResults.actions[0];
    
    return {
      message: primaryAction.payload.message,
      urgency: primaryAction.urgency,
      source: 'rule_engine',
      ruleId: primaryAction.ruleId
    };
  }

  async handleAIFallback(messageData, context) {
    // Fallback to Ollama AI model
    const aiResponse = await this.callOllamaAPI(messageData.message);
    
    return {
      message: aiResponse,
      urgency: 2, // INFO level
      source: 'ai_fallback'
    };
  }

  async callOllamaAPI(message) {
    try {
      const response = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL,
          prompt: `As a medical assistant, respond to: ${message}`,
          stream: false
        })
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      logger.error('Ollama API call failed:', error);
      return 'I apologize, I am having trouble processing your request. Please try again.';
    }
  }

  async storeConversation(messageData, response, ruleResults) {
    // Implementation from Week 1 - store in database
    // This would use the existing Conversation/Message models
  }

  handleErrorResponse(error, messageData) {
    return {
      response: 'Sorry, I encountered an error processing your message. Please try again.',
      sessionId: messageData.sessionId,
      urgency: 2,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

module.exports = new ChatService();
```

### 2. Rule Management API Endpoints
```javascript
// src/routes/rules.js
const express = require('express');
const router = express.Router();
const RuleService = require('../rule-engine/storage/RuleService');
const MedicalRuleValidator = require('../rule-engine/services/MedicalRuleValidator');
const logger = require('../utils/logger');

const ruleService = new RuleService();

// Get all rules
router.get('/', async (req, res) => {
  try {
    const rules = await ruleService.getAllRules();
    res.status(200).json({
      count: rules.length,
      rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        priority: rule.priority,
        language: rule.language,
        enabled: rule.enabled
      }))
    });
  } catch (error) {
    logger.error('Failed to fetch rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Get rule by ID
router.get('/:ruleId', async (req, res) => {
  try {
    const rule = await ruleService.getRuleById(req.params.ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json(rule);
  } catch (error) {
    logger.error('Failed to fetch rule:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// Create new rule
router.post('/', async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate rule
    const errors = MedicalRuleValidator.validateMedicalRule(ruleData);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid rule data', details: errors });
    }

    // Validate safety
    await MedicalRuleValidator.validateRuleSafety(ruleData);

    const rule = await ruleService.createRule(ruleData);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('Failed to create rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Update rule
router.put('/:ruleId', async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Validate if updating conditions/actions
    if (ruleData.conditions || ruleData.actions) {
      const errors = MedicalRuleValidator.validateMedicalRule(ruleData);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Invalid rule data', details: errors });
      }
      await MedicalRuleValidator.validateRuleSafety(ruleData);
    }

    const affected = await ruleService.updateRule(req.params.ruleId, ruleData);
    if (affected === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule updated successfully' });
  } catch (error) {
    logger.error('Failed to update rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete rule
router.delete('/:ruleId', async (req, res) => {
  try {
    const affected = await ruleService.deleteRule(req.params.ruleId);
    if (affected === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Evaluate rules against test context
router.post('/evaluate', async (req, res) => {
  try {
    const context = req.body;
    const ruleEngine = require('../rule-engine/engine/RuleEngine').getInstance();
    
    const results = await ruleEngine.evaluate(context);
    res.status(200).json(results);
  } catch (error) {
    logger.error('Rule evaluation failed:', error);
    res.status(500).json({ error: 'Rule evaluation failed' });
  }
});

module.exports = router;
```

### 3. Update App.js để Include Rule Routes
```javascript
// src/app.js (Updated)
// ... existing imports ...
const ruleRoutes = require('./routes/rules');

// ... existing middleware ...

// Add rule routes
app.use('/api/rules', ruleRoutes);

// ... existing routes and error handling ...
```

### 4. Comprehensive Integration Tests
```javascript
// tests/integration/rule-chat-integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');
const RuleService = require('../../src/rule-engine/storage/RuleService');

describe('Rule-Chat Integration Tests', () => {
  let ruleService;

  beforeAll(async () => {
    await sequelize.authenticate();
    ruleService = new RuleService();
    
    // Ensure medical rules are loaded
    const rules = await ruleService.getAllRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('POST /api/chat should use rule engine for medical emergencies', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'I have severe chest pain and difficulty breathing',
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        language: 'en'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body).toHaveProperty('urgency');
    expect(response.body.urgency).toBeGreaterThanOrEqual(8); // High urgency
    expect(response.body).toHaveProperty('ruleMatches');
    expect(response.body.ruleMatches.length).toBeGreaterThan(0);
  });

  test('POST /api/chat should use AI fallback for non-medical messages', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'What is the weather today?',
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        language: 'en'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body.urgency).toBe(2); // INFO level
    expect(response.body.ruleMatches).toHaveLength(0);
  });

  test('GET /api/rules should return all rules', async () => {
    const response = await request(app).get('/api/rules');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('rules');
    expect(response.body.routes.length).toBeGreaterThan(0);
  });

  test('POST /api/rules/evaluate should test rule evaluation', async () => {
    const testContext = {
      message: {
        text: 'chest pain emergency',
        language: 'en'
      },
      user: {
        id: 'test-user'
      }
    };

    const response = await request(app)
      .post('/api/rules/evaluate')
      .send(testContext);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('matchedRules');
    expect(response.body).toHaveProperty('actions');
    expect(response.body).toHaveProperty('executionTime');
  });
});
```

### 5. Performance Testing Suite
```javascript
// tests/performance/rule-performance.test.js
const RuleEngine = require('../../src/rule-engine/engine/RuleEngine');
const { sequelize } = require('../../src/models');

describe('Rule Engine Performance Tests', () => {
  let ruleEngine;

  beforeAll(async () => {
    await sequelize.authenticate();
    ruleEngine = new RuleEngine();
    
    const rules = await ruleEngine.ruleService.getAllRules();
    await ruleEngine.initialize(rules);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should evaluate rules under 100ms P95', async () => {
    const testContexts = [
      { message: { text: 'chest pain emergency', language: 'en' } },
      { message: { text: 'đau ngực khẩn cấp', language: 'vi' } },
      { message: { text: 'normal conversation', language: 'en' } },
      { message: { text: 'breathing difficulty', language: 'en' } },
      { message: { text: 'headache', language: 'en' } }
    ];

    const executionTimes = [];

    for (const context of testContexts) {
      for (let i = 0; i < 100; i++) { // 100 iterations per context
        const start = Date.now();
        await ruleEngine.evaluate(context);
        executionTimes.push(Date.now() - start);
      }
    }

    // Calculate P95
    executionTimes.sort((a, b) => a - b);
    const p95 = executionTimes[Math.floor(executionTimes.length * 0.95)];

    console.log(`Performance metrics:
      - Total evaluations: ${executionTimes.length}
      - Average time: ${executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length}ms
      - P95: ${p95}ms
      - Max: ${Math.max(...executionTimes)}ms
    `);

    expect(p95).toBeLessThan(100);
  }, 30000); // 30 second timeout
});
```

### 6. End-to-End Testing Script
```bash
#!/bin/bash
# tests/e2e-test-week2.sh
echo "=== Week 2 End-to-End Test ==="

# Start services
echo "Starting services..."
docker-compose up -d
sleep 10

# Run integration tests
echo "Running integration tests..."
npm run test:integration

# Run performance tests
echo "Running performance tests..."
npm run test:performance

# Test API endpoints
echo "Testing API endpoints..."
curl -s http://localhost:3001/api/rules | jq '.count'
curl -s http://localhost:3001/health | jq '.status'

# Test medical emergency scenario
echo "Testing medical emergency..."
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "chest pain and breathing difficulty",
    "userId": "e2e-test-user",
    "language": "en"
  }' | jq '