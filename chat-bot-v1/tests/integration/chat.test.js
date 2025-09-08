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