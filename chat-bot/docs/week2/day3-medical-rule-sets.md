# Day 3: Medical Rule Sets Development

## 🎯 Mục tiêu ngày 3
Phát triển comprehensive medical rule sets cho các tình huống khẩn cấp y tế, implement multi-language support, và testing với real-world scenarios.

## 📋 Prerequisites
- Đã hoàn thành Day 2: Core rule engine implemented
- Rule storage service working
- Database access với rule table
- Medical terminology references

## 🛠️ Tasks chi tiết

### 1. Medical Emergency Classification System
```javascript
// src/rule-engine/types/UrgencyLevels.js
module.exports = {
  CRITICAL: {
    level: 10,
    color: '#ff4444',
    description: 'Immediate medical attention required',
    responseTime: 'IMMEDIATE'
  },
  HIGH: {
    level: 8,
    color: '#ffbb33',
    description: 'Urgent medical attention recommended',
    responseTime: 'WITHIN_1_HOUR'
  },
  MEDIUM: {
    level: 6,
    color: '#00C851',
    description: 'Medical consultation advised',
    responseTime: 'WITHIN_24_HOURS'
  },
  LOW: {
    level: 4,
    color: '#33b5e5',
    description: 'Self-care recommended',
    responseTime: 'WHEN_CONVENIENT'
  },
  INFO: {
    level: 2,
    color: '#2BBBAD',
    description: 'General information',
    responseTime: 'NO_URGENCY'
  }
};
```

### 2. Base Medical Rule Templates
```javascript
// src/rule-engine/templates/MedicalRuleTemplates.js
const { UrgencyLevels } = require('../types/UrgencyLevels');

class MedicalRuleTemplates {
  static createEmergencyRule(templateName, config) {
    const templates = {
      CHEST_PAIN: {
        name: 'Chest Pain Emergency',
        conditions: [
          {
            field: 'message.text',
            operator: 'contains',
            value: config.keywords.chestPain
          },
          {
            field: 'message.text',
            operator: 'contains', 
            value: config.keywords.breathingDifficulty
          }
        ],
        actions: [
          {
            type: 'response',
            payload: {
              message: config.messages.emergency,
              urgency: UrgencyLevels.CRITICAL.level
            }
          },
          {
            type: 'redirect',
            payload: {
              service: 'emergency_services',
              priority: 'HIGHEST'
            }
          }
        ]
      },
      
      BREATHING_DIFFICULTY: {
        name: 'Breathing Difficulty',
        conditions: [
          {
            field: 'message.text',
            operator: 'contains',
            value: config.keywords.breathing
          }
        ],
        actions: [
          {
            type: 'response',
            payload: {
              message: config.messages.breathingEmergency,
              urgency: UrgencyLevels.HIGH.level
            }
          }
        ]
      }
    };

    return templates[templateName];
  }

  static getMultiLanguageConfig(language) {
    const configs = {
      vi: {
        keywords: {
          chestPain: ['đau ngực', 'tức ngực', 'đau tim'],
          breathingDifficulty: ['khó thở', 'thở gấp', 'nghẹt thở'],
          breathing: ['thở', 'hô hấp', 'khó thở']
        },
        messages: {
          emergency: '🚨 KHẨN CẤP: Vui lòng tìm kiếm sự chăm sóc y tế ngay lập tức!',
          breathingEmergency: '⚠️ Triệu chứng hô hấp: Vui lòng đến cơ sở y tế gần nhất'
        }
      },
      en: {
        keywords: {
          chestPain: ['chest pain', 'heart pain', 'chest discomfort'],
          breathingDifficulty: ['can\'t breathe', 'shortness of breath', 'breathing difficulty'],
          breathing: ['breathing', 'respiratory', 'shortness']
        },
        messages: {
          emergency: '🚨 EMERGENCY: Please seek immediate medical attention!',
          breathingEmergency: '⚠️ Breathing symptoms: Please visit nearest medical facility'
        }
      }
    };

    return configs[language] || configs.en;
  }
}

module.exports = MedicalRuleTemplates;
```

### 3. Medical Rule Generator Service
```javascript
// src/rule-engine/services/MedicalRuleGenerator.js
const MedicalRuleTemplates = require('../templates/MedicalRuleTemplates');
const RuleService = require('../storage/RuleService');
const logger = require('../../utils/logger');

class MedicalRuleGenerator {
  constructor() {
    this.ruleService = new RuleService();
    this.generatedRules = new Set();
  }

  async generateStandardMedicalRules() {
    const languages = ['vi', 'en'];
    const ruleTemplates = [
      'CHEST_PAIN',
      'BREATHING_DIFFICULTY',
      'SEVERE_HEADACHE',
      'STROKE_SYMPTOMS',
      'ALLERGIC_REACTION'
    ];

    try {
      for (const language of languages) {
        for (const templateName of ruleTemplates) {
          await this.generateRuleForLanguage(templateName, language);
        }
      }
      
      logger.info('Standard medical rules generated successfully');
    } catch (error) {
      logger.error('Failed to generate medical rules:', error);
      throw error;
    }
  }

  async generateRuleForLanguage(templateName, language) {
    const config = MedicalRuleTemplates.getMultiLanguageConfig(language);
    const template = MedicalRuleTemplates.createEmergencyRule(templateName, config);
    
    const ruleId = `${templateName}_${language}`.toLowerCase();
    
    if (this.generatedRules.has(ruleId)) {
      return; // Already generated
    }

    const ruleData = {
      id: ruleId,
      name: `${template.name} (${language.toUpperCase()})`,
      description: `Automatically generated medical rule for ${templateName}`,
      priority: template.priority || 8,
      conditions: template.conditions,
      actions: template.actions,
      language: language,
      enabled: true
    };

    try {
      await this.ruleService.createRule(ruleData);
      this.generatedRules.add(ruleId);
      logger.debug(`Generated rule: ${ruleId}`);
    } catch (error) {
      logger.warn(`Failed to create rule ${ruleId}:`, error.message);
    }
  }

  async generateCustomMedicalRule(ruleConfig) {
    const { name, conditions, actions, language = 'en', priority = 6 } = ruleConfig;
    
    const ruleData = {
      id: `custom_${Date.now()}`,
      name,
      description: 'Custom medical rule',
      priority,
      conditions,
      actions,
      language,
      enabled: true
    };

    return await this.ruleService.createRule(ruleData);
  }
}

module.exports = MedicalRuleGenerator;
```

### 4. Comprehensive Medical Rule Sets
```javascript
// scripts/generate-medical-rules.js
const { MedicalRuleGenerator } = require('../src/rule-engine/services/MedicalRuleGenerator');
const { sequelize } = require('../src/models');

const generateAllMedicalRules = async () => {
  try {
    console.log('Starting medical rules generation...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established');

    const generator = new MedicalRuleGenerator();
    
    // Generate standard rules
    await generator.generateStandardMedicalRules();
    
    // Generate additional specialized rules
    await generator.generateCustomMedicalRule({
      name: 'Diabetes Emergency - High Blood Sugar',
      conditions: [
        {
          field: 'message.text',
          operator: 'contains',
          value: ['high blood sugar', 'hyperglycemia', 'đường huyết cao']
        },
        {
          field: 'message.text',
          operator: 'contains',
          value: ['thirsty', 'khát nước', 'frequent urination', 'tiểu nhiều']
        }
      ],
      actions: [
        {
          type: 'response',
          payload: {
            message: {
              vi: '⚠️ Cảnh báo đường huyết cao: Uống nhiều nước và liên hệ bác sĩ ngay',
              en: '⚠️ High blood sugar warning: Drink plenty of water and contact doctor immediately'
            },
            urgency: 8
          }
        }
      ],
      language: 'multi'
    });

    console.log('Medical rules generation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Medical rules generation failed:', error);
    process.exit(1);
  }
};

generateAllMedicalRules();
```

### 5. Multi-language Support Implementation
```javascript
// src/rule-engine/utils/LanguageDetector.js
const franc = require('franc');

class LanguageDetector {
  static detectLanguage(text) {
    if (!text || text.length < 10) {
      return 'en'; // Default to English for short texts
    }

    const detected = franc(text, {
      minLength: 10,
      only: ['vie', 'eng', 'fra', 'spa']
    });

    const languageMap = {
      'vie': 'vi',
      'eng': 'en',
      'fra': 'fr',
      'spa': 'es'
    };

    return languageMap[detected] || 'en';
  }

  static normalizeText(text, language) {
    // Basic text normalization
    let normalized = text.toLowerCase().trim();
    
    // Language-specific normalization
    if (language === 'vi') {
      normalized = normalized.normalize('NFC'); // Vietnamese diacritics
    }
    
    return normalized;
  }

  static getLanguageSpecificKeywords(text, language) {
    const keywords = {
      vi: {
        chest: ['ngực', 'tim'],
        pain: ['đau', 'nhức', 'tức'],
        breathing: ['thở', 'hô hấp'],
        emergency: ['khẩn cấp', 'cấp cứu']
      },
      en: {
        chest: ['chest', 'heart'],
        pain: ['pain', 'hurt', 'ache'],
        breathing: ['breath', 'breathe', 'respiratory'],
        emergency: ['emergency', 'urgent']
      }
    };

    return keywords[language] || keywords.en;
  }
}

module.exports = LanguageDetector;
```

### 6. Medical Rule Validation Service
```javascript
// src/rule-engine/services/MedicalRuleValidator.js
const logger = require('../../utils/logger');

class MedicalRuleValidator {
  static validateMedicalRule(ruleData) {
    const errors = [];

    // Check for required fields
    if (!ruleData.name) errors.push('Rule name is required');
    if (!ruleData.conditions || !Array.isArray(ruleData.conditions)) {
      errors.push('Conditions must be an array');
    }
    if (!ruleData.actions || !Array.isArray(ruleData.actions)) {
      errors.push('Actions must be an array');
    }

    // Validate conditions
    if (ruleData.conditions) {
      ruleData.conditions.forEach((condition, index) => {
        if (!condition.field) errors.push(`Condition ${index}: field is required`);
        if (!condition.operator) errors.push(`Condition ${index}: operator is required`);
        if (condition.value === undefined) errors.push(`Condition ${index}: value is required`);
      });
    }

    // Validate actions
    if (ruleData.actions) {
      ruleData.actions.forEach((action, index) => {
        if (!action.type) errors.push(`Action ${index}: type is required`);
        if (!action.payload) errors.push(`Action ${index}: payload is required`);
      });
    }

    // Check for medical specificity
    if (ruleData.priority >= 8) { // High urgency rules
      const hasMedicalKeywords = this.containsMedicalKeywords(ruleData);
      if (!hasMedicalKeywords) {
        errors.push('High urgency rules must contain medical keywords');
      }
    }

    return errors;
  }

  static containsMedicalKeywords(ruleData) {
    const medicalKeywords = [
      // Vietnamese medical terms
      'đau', 'tim', 'ngực', 'máu', 'huyết', 'áp', 'đường',
      'thở', 'khó thở', 'khẩn cấp', 'cấp cứu', 'tử vong',
      
      // English medical terms
      'pain', 'heart', 'chest', 'blood', 'pressure', 'sugar',
      'breathe', 'breathing', 'emergency', 'urgent', 'fatal'
    ];

    const ruleText = JSON.stringify(ruleData).toLowerCase();
    return medicalKeywords.some(keyword => ruleText.includes(keyword));
  }

  static async validateRuleSafety(ruleData) {
    // Check for dangerous recommendations
    const dangerousPatterns = [
      /(don't|do not).* (go to|see|contact).* doctor/hospital/gi,
      /(tự điều trị|self treat|self medicate)/gi,
      /(bỏ qua|ignore).* (triệu chứng|symptoms)/gi
    ];

    const ruleText = JSON.stringify(ruleData).toLowerCase();
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(ruleText)) {
        throw new Error('Rule contains potentially dangerous recommendations');
      }
    }

    return true;
  }
}

module.exports = MedicalRuleValidator;
```

### 7. Medical Rule Testing Suite
```javascript
// tests/medical-rules/MedicalRuleTests.js
const RuleEngine = require('../../src/rule-engine/engine/RuleEngine');
const MedicalRuleGenerator = require('../../src/rule-engine/services/MedicalRuleGenerator');

describe('Medical Rule Tests', () => {
  let ruleEngine;

  beforeAll(async () => {
    ruleEngine = new RuleEngine();
    
    // Generate and load medical rules
    const generator = new MedicalRuleGenerator();
    await generator.generateStandardMedicalRules();
    
    const rules = await generator.ruleService.getAllRules();
    await ruleEngine.initialize(rules);
  });

  const testCases = [
    {
      name: 'Chest Pain Emergency - Vietnamese',
      input: {
        message: { text: 'Tôi bị đau ngực và khó thở' },
        user: { language: 'vi' }
      },
      expected: {
        hasEmergency: true,
        urgencyLevel: 10
      }
    },
    {
      name: 'Chest Pain Emergency - English',
      input: {
        message: { text: 'I have chest pain and can\'t breathe' },
        user: { language: 'en' }
      },
      expected: {
        hasEmergency: true, 
        urgencyLevel: 10
      }
    },
    {
      name: 'Breathing Difficulty',
      input: {
        message: { text: 'Tôi cảm thấy khó thở' },
        user: { language: 'vi' }
      },
      expected: {
        hasEmergency: true,
        urgencyLevel: 8
      }
    }
  ];

  testCases.forEach(testCase => {
    test(testCase.name, async () => {
      const results = await ruleEngine.evaluate(testCase.input);
      
      expect(results.matchedRules.length).toBeGreaterThan(0);
      
      if (testCase.expected.hasEmergency) {
        const hasHighUrgency = results.actions.some(action => 
          action.urgency >= testCase.expected.urgencyLevel
        );
        expect(hasHighUrgency).toBe(true);
      }
    });
  });
});
```

### 8. Medical Rule Deployment Script
```bash
#!/bin/bash
# scripts/deploy-medical-rules.sh
echo "=== Deploying Medical Rules ==="

# Run rule generation
node scripts/generate-medical-rules.js

# Verify rules were created
echo "Verifying rules..."
mysql -h localhost -u chatbot_user -psecure_password -e "
  USE chatbot_db;
  SELECT COUNT(*) as total_rules FROM rules;
  SELECT language, COUNT(*) as count FROM rules GROUP BY language;
"

# Test rule engine with medical scenarios
echo "Testing medical scenarios..."
node tests/medical-rules/MedicalRuleTests.js

echo "=== Medical Rules Deployment Complete ==="
```

## ✅ Success Criteria
- [ ] Medical urgency classification system implemented
- [ ] Standard medical rule templates created
- [ ] Multi-language support working
- [ ] Medical rule generator service complete
- [ ] Rule validation service implemented
- [ ] Comprehensive test suite passing
- [ ] Deployment script working

## 🚨 Troubleshooting
**Language Detection Issues**:
```javascript
// Debug language detection
const text = "Tôi bị đau ngực";
const detected = LanguageDetector.detectLanguage(text);
console.log(`Detected language: ${detected}`);
```

**Rule Validation Issues**:
```javascript
// Test rule validation
const errors = MedicalRuleValidator.validateMedicalRule(ruleData);
console.log('Validation errors:', errors);
```

## 📊 Time Estimation
| Task | Estimated Time |
|------|----------------|
| Medical Classification System | 60 phút |
| Rule Templates & Generator | 120 phút |
| Multi-language Support | 90 phút |
| Rule Validation | 60 phút |
| Testing Suite | 90 phút |
| Deployment Script | 30 phút |
| **Total** | **450 phút** |

## 🎯 Next Steps
Chuẩn bị cho Day 4:
- [ ] Verify all medical rules working correctly
- [ ] Test với real patient scenarios
- [ ] Prepare integration với chat service
- [ ] Setup monitoring cho medical rule usage