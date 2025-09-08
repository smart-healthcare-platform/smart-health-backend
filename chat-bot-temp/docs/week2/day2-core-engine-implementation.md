# Day 2: Core Engine Implementation

## 🎯 Mục tiêu ngày 2
Triển khai core components của Rule Engine: parser, compiler, và execution engine với đầy đủ functionality.

## 📋 Prerequisites
- Đã hoàn thành Day 1: Architecture design và rule schema
- Database setup với rule table
- Redis service running
- Project structure created

## 🛠️ Tasks chi tiết

### 1. Implement Rule Parser
```javascript
// src/rule-engine/parser/RuleParser.js
const logger = require('../../utils/logger');

class RuleParser {
  constructor() {
    this.operators = {
      'contains': (fieldValue, conditionValue) => {
        if (Array.isArray(conditionValue)) {
          return conditionValue.some(val => 
            fieldValue.toLowerCase().includes(val.toLowerCase())
          );
        }
        return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      },
      'equals': (fieldValue, conditionValue) => fieldValue === conditionValue,
      'matches': (fieldValue, conditionValue) => {
        const regex = new RegExp(conditionValue, 'i');
        return regex.test(fieldValue);
      },
      'greaterThan': (fieldValue, conditionValue) => fieldValue > conditionValue,
      'lessThan': (fieldValue, conditionValue) => fieldValue < conditionValue
    };
  }

  parseRule(ruleData) {
    try {
      // Validate rule structure
      this.validateRule(ruleData);
      
      return {
        ...ruleData,
        compiledConditions: this.compileConditions(ruleData.conditions),
        compiledActions: this.compileActions(ruleData.actions)
      };
    } catch (error) {
      logger.error('Rule parsing failed:', error);
      throw new Error(`Invalid rule format: ${error.message}`);
    }
  }

  validateRule(rule) {
    const requiredFields = ['name', 'conditions', 'actions'];
    requiredFields.forEach(field => {
      if (!rule[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
      throw new Error('Conditions must be a non-empty array');
    }

    if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
      throw new Error('Actions must be a non-empty array');
    }
  }

  compileConditions(conditions) {
    return conditions.map(condition => {
      if (!this.operators[condition.operator]) {
        throw new Error(`Unsupported operator: ${condition.operator}`);
      }
      
      return {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        evaluate: (context) => {
          const fieldValue = this.getFieldValue(context, condition.field);
          return this.operators[condition.operator](fieldValue, condition.value);
        }
      };
    });
  }

  compileActions(actions) {
    return actions.map(action => ({
      type: action.type,
      payload: action.payload,
      execute: (context) => this.executeAction(action, context)
    }));
  }

  getFieldValue(context, fieldPath) {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], context);
  }

  executeAction(action, context) {
    switch (action.type) {
      case 'response':
        return { type: 'response', message: action.payload.message };
      case 'redirect':
        return { type: 'redirect', service: action.payload.service };
      case 'alert':
        return { type: 'alert', level: action.payload.level };
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}

module.exports = RuleParser;
```

### 2. Implement Rule Compiler
```javascript
// src/rule-engine/compiler/RuleCompiler.js
const RuleParser = require('../parser/RuleParser');
const logger = require('../../utils/logger');

class RuleCompiler {
  constructor() {
    this.parser = new RuleParser();
    this.compiledRules = new Map();
  }

  async compileRule(ruleData) {
    try {
      const compiledRule = this.parser.parseRule(ruleData);
      this.compiledRules.set(ruleData.id, compiledRule);
      return compiledRule;
    } catch (error) {
      logger.error('Rule compilation failed:', error);
      throw error;
    }
  }

  async compileRules(rules) {
    const compiledRules = [];
    
    for (const rule of rules) {
      try {
        const compiledRule = await this.compileRule(rule);
        compiledRules.push(compiledRule);
      } catch (error) {
        logger.warn(`Skipping invalid rule ${rule.id}:`, error.message);
      }
    }
    
    return compiledRules;
  }

  getCompiledRule(ruleId) {
    return this.compiledRules.get(ruleId);
  }

  clearCompiledRules() {
    this.compiledRules.clear();
  }
}

module.exports = RuleCompiler;
```

### 3. Implement Rule Execution Engine
```javascript
// src/rule-engine/engine/RuleEngine.js
const RuleCompiler = require('../compiler/RuleCompiler');
const logger = require('../../utils/logger');

class RuleEngine {
  constructor() {
    this.compiler = new RuleCompiler();
    this.rules = [];
  }

  async initialize(rules) {
    try {
      this.rules = await this.compiler.compileRules(rules);
      logger.info(`Rule engine initialized with ${this.rules.length} rules`);
    } catch (error) {
      logger.error('Rule engine initialization failed:', error);
      throw error;
    }
  }

  async evaluate(context) {
    const results = {
      matchedRules: [],
      actions: [],
      executionTime: 0
    };

    const startTime = Date.now();

    try {
      for (const rule of this.rules) {
        if (!rule.enabled) continue;

        const ruleResult = await this.evaluateRule(rule, context);
        if (ruleResult.matched) {
          results.matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority
          });

          results.actions.push(...ruleResult.actions);
        }
      }

      // Sort actions by rule priority
      results.actions.sort((a, b) => b.priority - a.priority);
      
    } catch (error) {
      logger.error('Rule evaluation failed:', error);
      throw error;
    } finally {
      results.executionTime = Date.now() - startTime;
    }

    return results;
  }

  async evaluateRule(rule, context) {
    const result = {
      matched: true,
      actions: []
    };

    try {
      // Evaluate all conditions
      for (const condition of rule.compiledConditions) {
        if (!condition.evaluate(context)) {
          result.matched = false;
          break;
        }
      }

      if (result.matched) {
        // Execute all actions
        for (const action of rule.compiledActions) {
          const actionResult = action.execute(context);
          result.actions.push({
            ...actionResult,
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority
          });
        }
      }
    } catch (error) {
      logger.error(`Rule evaluation failed for ${rule.id}:`, error);
      result.matched = false;
    }

    return result;
  }

  async addRule(ruleData) {
    try {
      const compiledRule = await this.compiler.compileRule(ruleData);
      this.rules.push(compiledRule);
      return compiledRule;
    } catch (error) {
      logger.error('Failed to add rule:', error);
      throw error;
    }
  }

  async removeRule(ruleId) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    this.compiler.compiledRules.delete(ruleId);
  }

  getRules() {
    return this.rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      priority: rule.priority,
      enabled: rule.enabled
    }));
  }
}

module.exports = RuleEngine;
```

### 4. Implement Rule Storage Service
```javascript
// src/rule-engine/storage/RuleService.js
const { Rule } = require('./Rule');
const logger = require('../../utils/logger');

class RuleService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getAllRules() {
    try {
      return await Rule.findAll({
        where: { enabled: true },
        order: [['priority', 'DESC']]
      });
    } catch (error) {
      logger.error('Failed to fetch rules:', error);
      throw error;
    }
  }

  async getRuleById(ruleId) {
    try {
      const cachedRule = this.cache.get(ruleId);
      if (cachedRule && Date.now() - cachedRule.timestamp < this.cacheTTL) {
        return cachedRule.data;
      }

      const rule = await Rule.findByPk(ruleId);
      if (rule) {
        this.cache.set(ruleId, {
          data: rule,
          timestamp: Date.now()
        });
      }
      
      return rule;
    } catch (error) {
      logger.error(`Failed to fetch rule ${ruleId}:`, error);
      throw error;
    }
  }

  async createRule(ruleData) {
    try {
      const rule = await Rule.create(ruleData);
      this.cache.delete('all'); // Invalidate cache
      return rule;
    } catch (error) {
      logger.error('Failed to create rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId, updates) {
    try {
      const [affectedCount] = await Rule.update(updates, {
        where: { id: ruleId }
      });
      
      if (affectedCount > 0) {
        this.cache.delete(ruleId);
        this.cache.delete('all');
      }
      
      return affectedCount;
    } catch (error) {
      logger.error(`Failed to update rule ${ruleId}:`, error);
      throw error;
    }
  }

  async deleteRule(ruleId) {
    try {
      const affectedCount = await Rule.destroy({
        where: { id: ruleId }
      });
      
      if (affectedCount > 0) {
        this.cache.delete(ruleId);
        this.cache.delete('all');
      }
      
      return affectedCount;
    } catch (error) {
      logger.error(`Failed to delete rule ${ruleId}:`, error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = RuleService;
```

### 5. Tạo Unit Tests
```javascript
// tests/rule-engine/RuleParser.test.js
const RuleParser = require('../../src/rule-engine/parser/RuleParser');

describe('RuleParser', () => {
  let parser;

  beforeEach(() => {
    parser = new RuleParser();
  });

  test('should parse valid rule correctly', () => {
    const ruleData = {
      id: 'test-rule',
      name: 'Test Rule',
      conditions: [{
        field: 'message.text',
        operator: 'contains',
        value: 'test'
      }],
      actions: [{
        type: 'response',
        payload: { message: 'Test response' }
      }]
    };

    const parsedRule = parser.parseRule(ruleData);
    expect(parsedRule).toHaveProperty('compiledConditions');
    expect(parsedRule).toHaveProperty('compiledActions');
    expect(parsedRule.compiledConditions).toHaveLength(1);
    expect(parsedRule.compiledActions).toHaveLength(1);
  });

  test('should throw error for invalid rule', () => {
    const invalidRule = { name: 'Test' }; // Missing conditions and actions
    expect(() => parser.parseRule(invalidRule)).toThrow();
  });

  test('should evaluate contains operator correctly', () => {
    const condition = {
      field: 'message.text',
      operator: 'contains',
      value: 'hello'
    };
    
    const compiled = parser.compileConditions([condition])[0];
    const context = { message: { text: 'hello world' } };
    
    expect(compiled.evaluate(context)).toBe(true);
  });
});
```

### 6. Integration Test Script
```javascript
// tests/integration/rule-engine.test.js
const RuleEngine = require('../../src/rule-engine/engine/RuleEngine');
const RuleService = require('../../src/rule-engine/storage/RuleService');

describe('Rule Engine Integration', () => {
  let ruleEngine;
  let ruleService;

  beforeAll(async () => {
    ruleEngine = new RuleEngine();
    ruleService = new RuleService();
    
    // Load test rules
    const rules = await ruleService.getAllRules();
    await ruleEngine.initialize(rules);
  });

  test('should evaluate medical emergency rules', async () => {
    const context = {
      message: {
        text: 'I have chest pain and difficulty breathing',
        language: 'en'
      },
      user: {
        id: 'test-user',
        location: 'Hanoi'
      }
    };

    const results = await ruleEngine.evaluate(context);
    
    expect(results.matchedRules.length).toBeGreaterThan(0);
    expect(results.actions.length).toBeGreaterThan(0);
    expect(results.executionTime).toBeLessThan(100);
  });
});
```

### 7. Performance Test Script
```bash
#!/bin/bash
# scripts/performance-test.sh
echo "=== Rule Engine Performance Test ==="

# Test with 1000 evaluations
for i in {1..1000}; do
  curl -s -X POST http://localhost:3001/api/rules/evaluate \
    -H "Content-Type: application/json" \
    -d '{
      "message": {
        "text": "test message $i",
        "language": "en"
      }
    }' > /dev/null &
done

wait
echo "Performance test completed - 1000 requests"
```

## ✅ Success Criteria
- [ ] Rule parser implemented với full validation
- [ ] Rule compiler working với caching
- [ ] Execution engine complete với priority handling
- [ ] Storage service với caching mechanism
- [ ] Unit tests passing
- [ ] Integration tests working
- [ ] Performance tests < 100ms

## 🚨 Troubleshooting
**Rule Evaluation Issues**:
```javascript
// Debug rule evaluation
const debugContext = { message: { text: 'chest pain' } };
const results = await ruleEngine.evaluate(debugContext);
console.log('Debug results:', JSON.stringify(results, null, 2));
```

**Performance Issues**:
```bash
# Monitor Redis cache hits
redis-cli -a redis_password monitor | grep rule:
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Rule Parser Implementation | 120 phút |
| Rule Compiler Implementation | 90 phút |
| Execution Engine | 120 phút |
| Storage Service | 60 phút |
| Testing | 90 phút |
| **Total** | **480 phút** |

## 🎯 Next Steps
Chuẩn bị cho Day 3:
- [ ] Verify all core components working
- [ ] Test với real medical scenarios
- [ ] Prepare medical rule templates
- [ ] Setup monitoring cho rule execution