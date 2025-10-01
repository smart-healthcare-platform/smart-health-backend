import request from 'supertest';
import { app, server, initializeModels } from '../../app'; // Không import sequelize từ app
import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import axios from 'axios';
import { Sequelize } from 'sequelize';

// Mock axios để kiểm soát Auth Service
jest.mock('axios');

// Sử dụng một instance Sequelize riêng cho test với SQLite in-memory
const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

// Khởi tạo models với testSequelize
initializeModels(testSequelize);

// Mock axios để kiểm soát Auth Service
jest.mock('axios');

describe('Conversation API Integration Tests', () => {
  const mockUserId = 'test-user-id';
  const mockToken = 'mock-jwt-token';

  beforeAll(async () => {
    // Đồng bộ hóa cơ sở dữ liệu in-memory cho môi trường test
    await testSequelize.sync({ force: true }); // Xóa và tạo lại bảng
    // Mock Auth Service để luôn xác thực thành công token
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: mockUserId, userRole: 'patient' },
    });
  });

  afterAll(async () => {
    await testSequelize.close(); // Đóng kết nối DB in-memory
    server.close(); // Đóng server Express
  });

  beforeEach(async () => {
    // Xóa dữ liệu trước mỗi test
    await Message.destroy({ truncate: true });
    await ConversationParticipant.destroy({ truncate: true });
    await Conversation.destroy({ truncate: true });
  });

  it('GET /api/conversations should return an empty array if no conversations exist for the user', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/conversations should return conversations for the authenticated user', async () => {
    // Tạo dữ liệu test
    const conversation1 = await Conversation.create({ id: 'conv1' });
    const conversation2 = await Conversation.create({ id: 'conv2' });

    await ConversationParticipant.create({ conversationId: 'conv1', userId: mockUserId, role: 'patient' });
    await ConversationParticipant.create({ conversationId: 'conv1', userId: 'doctor-id', role: 'doctor' });
    await ConversationParticipant.create({ conversationId: 'conv2', userId: mockUserId, role: 'patient' });

    await Message.create({ conversationId: 'conv1', senderId: 'doctor-id', content: 'Hi patient!', contentType: 'text' });
    await Message.create({ conversationId: 'conv2', senderId: mockUserId, content: 'Hello doctor!', contentType: 'text' });

    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBeDefined();
    expect(res.body[0].lastMessage.content).toBeDefined();
  });

  it('GET /api/conversations/:conversationId/messages should return messages for a given conversation', async () => {
    const conversation = await Conversation.create({ id: 'conv3' });
    await ConversationParticipant.create({ conversationId: 'conv3', userId: mockUserId, role: 'patient' });
    await Message.create({ conversationId: 'conv3', senderId: mockUserId, content: 'Message 1', contentType: 'text', createdAt: new Date('2023-01-01T10:00:00Z') });
    await Message.create({ conversationId: 'conv3', senderId: mockUserId, content: 'Message 2', contentType: 'text', createdAt: new Date('2023-01-01T10:01:00Z') });

    const res = await request(app)
      .get('/api/conversations/conv3/messages')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toEqual('Message 2'); // Sắp xếp DESC
  });

  it('GET /api/conversations/:conversationId/messages should return 403 if user is not a participant', async () => {
    const conversation = await Conversation.create({ id: 'conv4' });
    await Message.create({ conversationId: 'conv4', senderId: 'other-user', content: 'Message 1', contentType: 'text' });

    const res = await request(app)
      .get('/api/conversations/conv4/messages')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body).toEqual({ message: 'Forbidden: You are not a participant of this conversation.' });
  });

  it('GET /api/conversations/:conversationId/messages with "before" cursor should return older messages', async () => {
    const conversation = await Conversation.create({ id: 'conv5' });
    await ConversationParticipant.create({ conversationId: 'conv5', userId: mockUserId, role: 'patient' });
    await Message.bulkCreate([
      { conversationId: 'conv5', senderId: mockUserId, content: 'Msg 1', contentType: 'text', createdAt: new Date('2023-01-01T10:00:00Z') },
      { conversationId: 'conv5', senderId: mockUserId, content: 'Msg 2', contentType: 'text', createdAt: new Date('2023-01-01T10:01:00Z') },
      { conversationId: 'conv5', senderId: mockUserId, content: 'Msg 3', contentType: 'text', createdAt: new Date('2023-01-01T10:02:00Z') },
    ]);

    // Lấy tin nhắn trước thời điểm của Msg 2 (chỉ nên trả về Msg 1)
    const res = await request(app)
      .get('/api/conversations/conv5/messages?before=2023-01-01T10:01:30Z')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(2); // Should return Msg 1 and Msg 2 (because DESC order)
    expect(res.body[0].content).toEqual('Msg 2');
    expect(res.body[1].content).toEqual('Msg 1');
  });
});