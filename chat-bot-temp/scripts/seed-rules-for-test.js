// This script is intended for use in test environments only.
const RuleService = require('../src/rule-engine/storage/RuleService');
const ruleService = new RuleService();

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
    }
  ];

module.exports = { medicalRules, ruleService };