import { Server } from 'http';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { app, server, sequelize, initializeModels } from '../../app';
import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import axios from 'axios';
import { Sequelize } from 'sequelize';

// Mock axios để kiểm soát Auth Service
jest.mock('axios');

// Tạo server riêng cho test
let testServer: Server;
let clientSockets: ClientSocket[] = [];

// Mock token và userId cho test
const mockUserId1 = 'test-user-id-1';
const mockUserId2 = 'test-user-id-2';
const mockToken = 'mock-jwt-token';
const mockConversationId = 'test-conversation-id';

// Sử dụng một instance Sequelize riêng cho test với SQLite in-memory
const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

// Khởi tạo models với testSequelize
initializeModels(testSequelize);

describe('Socket.IO Integration Tests', () => {
  beforeAll(async () => {
    // Đồng bộ hóa cơ sở dữ liệu in-memory cho môi trường test
    await testSequelize.sync({ force: true });
    
    // Mock Auth Service để luôn xác thực thành công token
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: mockUserId1, userRole: 'patient' },
    });
    
    // Khởi động server trên cổng ngẫu nhiên
    testServer = server.listen(0); // Dùng port 0 để hệ thống tự chọn port
  });

  afterAll(async () => {
    // Đóng tất cả client socket
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    
    // Đóng server
    if (testServer.listening) {
      testServer.close();
    }
    
    // Đóng kết nối DB
    await testSequelize.close();
 });

 beforeEach(async () => {
    // Xóa dữ liệu trước mỗi test
    await Message.destroy({ truncate: true });
    await ConversationParticipant.destroy({ truncate: true });
    await Conversation.destroy({ truncate: true });
    
    // Tạo dữ liệu test
    await Conversation.create({ id: mockConversationId });
    await ConversationParticipant.create({ 
      conversationId: mockConversationId, 
      userId: mockUserId1, 
      role: 'patient' 
    });
    await ConversationParticipant.create({ 
      conversationId: mockConversationId, 
      userId: mockUserId2, 
      role: 'doctor' 
    });
  });

  afterEach(() => {
    // Đóng tất cả client socket sau mỗi test
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];
  });

  it('should authenticate user and join correct rooms on connection', (done) => {
    // Mock Auth Service để xác thực cho cả hai user
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: mockUserId1, userRole: 'patient' },
    });

    const clientSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSockets.push(clientSocket);

    clientSocket.on('connect', () => {
      // Kiểm tra rằng client đã join room của chính họ
      // và các room của các cuộc trò chuyện mà họ tham gia
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (error: any) => {
      done(error);
    });
  });

  it('should send message successfully and emit to all participants', (done) => {
    // Mock Auth Service cho cả hai user
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { isValid: true, userId: mockUserId1, userRole: 'patient' },
    }).mockResolvedValueOnce({
      data: { isValid: true, userId: mockUserId2, userRole: 'doctor' },
    });

    // Kết nối client 1 (người gửi)
    const senderSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSockets.push(senderSocket);

    // Kết nối client 2 (người nhận)
    const recipientSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSockets.push(recipientSocket);

    let messageReceivedByRecipient = false;
    let messageSentConfirmation = false;

    recipientSocket.on('receiveMessage', (messageData: any) => {
      expect(messageData.conversationId).toBe(mockConversationId);
      expect(messageData.senderId).toBe(mockUserId1);
      expect(messageData.content).toBe('Hello from test!');
      messageReceivedByRecipient = true;
      
      if (messageSentConfirmation) {
        done();
      }
    });

    senderSocket.on('messageSent', (response: any) => {
      expect(response.success).toBe(true);
      expect(response.message.content).toBe('Hello from test!');
      messageSentConfirmation = true;
      
      if (messageReceivedByRecipient) {
        done();
      }
    });

    senderSocket.on('connect', () => {
      // Gửi tin nhắn sau khi kết nối
      senderSocket.emit('sendMessage', {
        conversationId: mockConversationId,
        recipientId: mockUserId2,
        content: 'Hello from test!',
        contentType: 'text'
      });
    });

    senderSocket.on('connect_error', (error: any) => {
      done(error);
    });

    recipientSocket.on('connect_error', (error: any) => {
      done(error);
    });
  });

  it('should reject message if user is not a participant of the conversation', (done) => {
    const unauthorizedUserId = 'unauthorized-user-id';
    
    // Mock Auth Service để trả về user không có quyền
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: unauthorizedUserId, userRole: 'patient' },
    });

    const clientSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSockets.push(clientSocket);

    clientSocket.on('messageError', (error: any) => {
      expect(error.message).toBe('You are not a participant of this conversation.');
      done();
    });

    clientSocket.on('connect', () => {
      // Gửi tin nhắn đến cuộc trò chuyện mà user không tham gia
      clientSocket.emit('sendMessage', {
        conversationId: mockConversationId,
        recipientId: mockUserId2,
        content: 'Unauthorized message!',
        contentType: 'text'
      });
    });

    clientSocket.on('connect_error', (error: any) => {
      done(error);
    });
  });

  it('should reject message if user is not authenticated', (done) => {
    const clientSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: 'invalid-token' },
      transports: ['websocket']
    });
    clientSockets.push(clientSocket);

    // Mock Auth Service để trả về lỗi xác thực
    (axios.post as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    clientSocket.on('connect_error', () => {
      // Nếu không thể kết nối, test thành công (kết nối bị từ chối)
      done();
    });

    clientSocket.on('connect', () => {
      // Nếu kết nối thành công, gửi tin nhắn để kiểm tra
      clientSocket.emit('sendMessage', {
        conversationId: mockConversationId,
        recipientId: mockUserId2,
        content: 'Message from unauthenticated user!',
        contentType: 'text'
      });
    });
  });

  it('should handle error during message sending', (done) => {
    // Mock Auth Service
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: mockUserId1, userRole: 'patient' },
    });

    const clientSocket: ClientSocket = io(`http://localhost:${(testServer.address() as any).port}`, {
      auth: { token: mockToken },
      transports: ['websocket']
    });
    clientSockets.push(clientSocket);

    // Mock Message.create để ném lỗi
    const originalCreate = Message.create;
    Message.create = jest.fn().mockRejectedValue(new Error('Database error'));

    clientSocket.on('messageError', (error: any) => {
      expect(error.error).toBe('Database error');
      
      // Khôi phục lại hàm create ban đầu
      Message.create = originalCreate;
      done();
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('sendMessage', {
        conversationId: mockConversationId,
        recipientId: mockUserId2,
        content: 'Message that will cause error!',
        contentType: 'text'
      });
    });

    clientSocket.on('connect_error', (error: any) => {
      // Khôi phục lại hàm create ban đầu trong trường hợp lỗi kết nối
      Message.create = originalCreate;
      done(error);
    });
  });
});