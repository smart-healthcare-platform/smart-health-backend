const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');
const chatService = require('../../src/services/chatService');
const { medicalRules, ruleService } = require('../../scripts/seed-rules-for-test');

describe('Chat Service and Rule Engine Integration', () => {

  beforeAll(async () => {
    // Re-initialize the service to load the new rules after global setup
    chatService.isInitialized = false;
    await chatService.initialize();
  });

  afterAll(async () => {
    // No specific teardown needed here as globalTeardown handles DB closing
  });

  test('should trigger the chest pain emergency rule for English text', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: "I have a sharp chest pain and it's hard to breathe",
        userId: 'integration-test-user-1',
        language: 'en'
      });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('rule_engine');
    expect(response.body.urgency).toBe('CRITICAL');
    expect(response.body.ruleMatches).toContain('Emergency: Chest Pain (EN)');
    expect(response.body.response).toContain('seek immediate medical attention');
  });

  test('should trigger the chest pain emergency rule for Vietnamese text', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'tôi bị đau ngực và khó thở lắm',
        userId: 'integration-test-user-2',
        language: 'vi'
      });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('rule_engine');
    expect(response.body.urgency).toBe('CRITICAL');
    expect(response.body.ruleMatches).toContain('Khẩn cấp: Đau ngực (VI)');
    expect(response.body.response).toContain('đến ngay cơ sở y tế gần nhất');
  });

  test('should trigger the greeting rule for a simple hello', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'chào bạn',
        userId: 'integration-test-user-3',
        language: 'vi'
      });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('rule_engine');
    expect(response.body.urgency).toBe('INFO');
    expect(response.body.ruleMatches).toContain('Thông tin: Chào hỏi (VI)');
  });

  test('should use AI fallback when no rules match', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'What is the weather like today?',
        userId: 'integration-test-user-4',
        language: 'en'
      });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('ai_fallback');
    expect(response.body.urgency).toBe('INFO');
    expect(response.body.ruleMatches).toHaveLength(0);
  });
});