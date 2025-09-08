const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); 

// Only import RuleService and logger, remove sequelize and syncDatabase as they are for main app
const RuleService = require('../src/rule-engine/storage/RuleService');
const logger = require('../src/utils/logger');

// Define medical rules here
const medicalRules = [
  {
    id: 'emergency_chest_pain_en',
    name: 'Emergency: Chest Pain (EN)',
    description: 'Detects mentions of chest pain combined with breathing difficulty in English.',
    priority: 10,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['chest pain', 'heart pain', 'chest discomfort']
      },
      {
        field: 'message.text', 
        operator: 'contains',
        value: ["can't breathe", 'shortness of breath', 'breathing difficulty']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: '🚨 EMERGENCY: Based on your description of chest pain and difficulty breathing, please seek immediate medical attention or call emergency services. This could be a sign of a serious condition.',
          urgency: 'CRITICAL'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'emergency_chest_pain_vi',
    name: 'Khẩn cấp: Đau ngực (VI)',
    description: 'Phát hiện đề cập đến đau ngực kèm khó thở bằng tiếng Việt.',
    priority: 10,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['đau ngực', 'tức ngực', 'đau tim']
      },
      {
        field: 'message.text', 
        operator: 'contains',
        value: ['khó thở', 'thở gấp', 'nghẹt thở']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: '🚨 KHẨN CẤP: Dựa trên mô tả về triệu chứng đau ngực và khó thở, vui lòng đến ngay cơ sở y tế gần nhất hoặc gọi cấp cứu. Đây có thể là dấu hiệu của một tình trạng nguy hiểm.',
          urgency: 'CRITICAL'
        }
      }
    ],
    language: 'vi',
    enabled: true
  },
  {
    id: 'info_greeting_en',
    name: 'Info: Greeting (EN)',
    description: 'Responds to common greetings in English.',
    priority: 1,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['hello', 'hi', 'hey']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'Hello! How can I help you today? Please describe your symptoms.',
          urgency: 'INFO'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'info_greeting_vi',
    name: 'Thông tin: Chào hỏi (VI)',
    description: 'Phản hồi các câu chào hỏi thông thường bằng tiếng Việt.',
    priority: 1,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['chào', 'xin chào']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay? Vui lòng mô tả triệu chứng của bạn.',
          urgency: 'INFO'
        }
      }
    ],
    language: 'vi',
    enabled: true
  },
  {
    id: 'info_covid19_en',
    name: 'Info: COVID-19 (EN)',
    description: 'Provides general information about COVID-19.',
    priority: 2,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['covid', 'coronavirus', 'pandemic']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. Common symptoms include fever, cough, and shortness of breath. Please consult a healthcare professional for diagnosis and treatment.',
          urgency: 'INFO'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'info_covid19_vi',
    name: 'Thông tin: COVID-19 (VI)',
    description: 'Cung cấp thông tin chung về COVID-19.',
    priority: 2,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['covid', 'corona', 'đại dịch']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'COVID-19 là bệnh hô hấp do virus SARS-CoV-2 gây ra. Các triệu chứng phổ biến bao gồm sốt, ho và khó thở. Vui lòng tham khảo ý kiến chuyên gia y tế để được chẩn đoán và điều trị.',
          urgency: 'INFO'
        }
      }
    ],
    language: 'vi',
    enabled: true
  },
  {
    id: 'symptom_fever_en',
    name: 'Symptom: Fever (EN)',
    description: 'Provides advice for fever symptoms.',
    priority: 3,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['fever', 'high temperature', 'hot']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'If you have a fever, rest, drink plenty of fluids, and consider over-the-counter medication. If your fever is high, persistent, or accompanied by other severe symptoms, please see a doctor.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'en',
    enabled: true
  },
  {
    id: 'symptom_fever_vi',
    name: 'Triệu chứng: Sốt (VI)',
    description: 'Cung cấp lời khuyên cho triệu chứng sốt.',
    priority: 3,
    conditions: [
      {
        field: 'message.text',
        operator: 'contains',
        value: ['sốt', 'nóng', 'nóng sốt']
      }
    ],
    actions: [
      {
        type: 'response',
        payload: {
          message: 'Nếu bạn bị sốt, hãy nghỉ ngơi, uống nhiều nước và cân nhắc dùng thuốc không kê đơn. Nếu sốt cao, kéo dài hoặc kèm theo các triệu chứng nghiêm trọng khác, vui lòng đi khám bác sĩ.',
          urgency: 'NORMAL'
        }
      }
    ],
    language: 'vi',
    enabled: true
  }
];

// Reusable function to seed rules
const seedRules = async (ruleServiceInstance) => {
  try {
    logger.info('Seeding medical rules...');
    for (const ruleData of medicalRules) {
      // Check if rule already exists by ID
      const existingRule = await ruleServiceInstance.getRuleById(ruleData.id);
      if (existingRule) {
        await ruleServiceInstance.updateRule(ruleData.id, ruleData);
        logger.info(`Rule updated: ${ruleData.name}`);
      } else {
        await ruleServiceInstance.createRule(ruleData);
        logger.info(`Rule created: ${ruleData.name}`);
      }
    }
    logger.info('Medical rules seeded successfully!');
  } catch (error) {
    logger.error('Failed to seed medical rules:', error);
    throw error; // Re-throw to indicate failure
  }
};

module.exports = {
  medicalRules,
  seedRules
};