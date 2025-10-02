import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import { AuthenticatedSocket } from '../../types/socket';
import { Server } from 'socket.io';
import { handleSendMessage, handleConnection, handleDisconnect } from '../../sockets/messageHandler';

// Mock các model
jest.mock('../../models/conversation');
jest.mock('../../models/conversation-participant');
jest.mock('../../models/message');

describe('Message Handler Functions', () => {
 // Mock dữ liệu
  const mockUserId = 'test-user-id';
  const mockConversationId = 'test-conversation-id';
  const mockRecipientId = 'test-recipient-id';
 const mockMessageContent = 'Test message content';

  let mockSocket: Partial<AuthenticatedSocket>;
  let mockIo: Partial<Server>;

  beforeEach(() => {
    mockSocket = {
      userId: mockUserId,
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      id: 'test-socket-id',
      connected: true,
      data: {},
      handshake: {} as any,
    } as Partial<AuthenticatedSocket>;

    mockIo = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn()
      }),
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([])
      })
    } as Partial<Server>;

    // Reset các mock
    jest.clearAllMocks();
  });

  describe('handleSendMessage', () => {
    it('should verify that user is participant of conversation before sending message', async () => {
      // Mock để trả về participant
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        conversationId: mockConversationId
      });

      // Gọi hàm xử lý tin nhắn
      await handleSendMessage(
        mockSocket as unknown as AuthenticatedSocket,
        mockIo as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng đã xác thực người dùng là thành viên
      expect(ConversationParticipant.findOne).toHaveBeenCalledWith({
        where: { conversationId: mockConversationId, userId: mockUserId }
      });
    });

    it('should reject message if user is not a participant of the conversation', async () => {
      // Mock để trả về null (người dùng không phải là thành viên)
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue(null);

      const mockSocketWithEmit = {
        ...mockSocket,
        emit: jest.fn()
      };

      // Gọi hàm xử lý tin nhắn
      await handleSendMessage(
        mockSocketWithEmit as unknown as AuthenticatedSocket,
        mockIo as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng đã gửi lỗi cho client
      expect(mockSocketWithEmit.emit).toHaveBeenCalledWith('messageError', {
        message: 'You are not a participant of this conversation.'
      });
    });

    it('should create message in database when all validations pass', async () => {
      // Mock để trả về participant
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        conversationId: mockConversationId
      });

      const mockCreatedMessage = {
        id: 'new-message-id',
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: mockMessageContent,
        contentType: 'text' as const,
        isRead: false,
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'new-message-id',
          conversationId: mockConversationId,
          senderId: mockUserId,
          content: mockMessageContent,
          contentType: 'text',
          isRead: false,
          createdAt: new Date()
        })
      };

      (Message.create as jest.Mock).mockResolvedValue(mockCreatedMessage);

      await handleSendMessage(
        mockSocket as unknown as AuthenticatedSocket,
        mockIo as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng tin nhắn đã được tạo trong DB
      expect(Message.create).toHaveBeenCalledWith({
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: mockMessageContent,
        contentType: 'text',
        isRead: false,
      });
    });

    it('should emit message to all participants in the conversation', async () => {
      // Mock để trả về participant
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        conversationId: mockConversationId
      });

      // Mock để trả về danh sách participants
      const mockParticipants = [
        { userId: mockUserId },
        { userId: mockRecipientId }
      ];
      (ConversationParticipant.findAll as jest.Mock).mockResolvedValue(mockParticipants);

      const mockCreatedMessage = {
        id: 'new-message-id',
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: mockMessageContent,
        contentType: 'text' as const,
        isRead: false,
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'new-message-id',
          conversationId: mockConversationId,
          senderId: mockUserId,
          content: mockMessageContent,
          contentType: 'text',
          isRead: false,
          createdAt: new Date()
        })
      };

      (Message.create as jest.Mock).mockResolvedValue(mockCreatedMessage);

      const mockIoWithEmit = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn()
        }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([])
        })
      } as Partial<Server>;

      await handleSendMessage(
        mockSocket as unknown as AuthenticatedSocket,
        mockIoWithEmit as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng tin nhắn đã được phát đến tất cả các participants
      expect(mockIoWithEmit.to).toHaveBeenCalledTimes(mockParticipants.length);
      mockParticipants.forEach(participant => {
        expect(mockIoWithEmit.to).toHaveBeenCalledWith(participant.userId);
      });
    });

    it('should handle errors during message creation', async () => {
      // Mock để trả về participant
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        conversationId: mockConversationId
      });

      // Mock lỗi khi tạo tin nhắn
      (Message.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const mockSocketWithEmit = {
        ...mockSocket,
        emit: jest.fn()
      };

      await handleSendMessage(
        mockSocketWithEmit as unknown as AuthenticatedSocket,
        mockIo as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng đã gửi lỗi cho client
      expect(mockSocketWithEmit.emit).toHaveBeenCalledWith('messageError', {
        error: 'Database error'
      });
    });

    it('should send notification if recipient is offline', async () => {
      // Mock để trả về participant
      (ConversationParticipant.findOne as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        conversationId: mockConversationId
      });

      // Mock để trả về danh sách participants
      const mockParticipants = [
        { userId: mockUserId },
        { userId: mockRecipientId }
      ];
      (ConversationParticipant.findAll as jest.Mock).mockResolvedValue(mockParticipants);

      const mockCreatedMessage = {
        id: 'new-message-id',
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: mockMessageContent,
        contentType: 'text' as const,
        isRead: false,
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          id: 'new-message-id',
          conversationId: mockConversationId,
          senderId: mockUserId,
          content: mockMessageContent,
          contentType: 'text',
          isRead: false,
          createdAt: new Date()
        })
      };

      (Message.create as jest.Mock).mockResolvedValue(mockCreatedMessage);

      // Mock recipient là offline (không có socket nào trong room của họ)
      const mockFetchSockets = jest.fn().mockResolvedValue([]);
      const mockInNamespace = {
        fetchSockets: mockFetchSockets
      };
      const mockIoWithOfflineRecipient = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn()
        }),
        in: jest.fn().mockReturnValue(mockInNamespace)
      } as Partial<Server>;

      await handleSendMessage(
        mockSocket as unknown as AuthenticatedSocket,
        mockIoWithOfflineRecipient as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng fetchSockets đã được gọi để kiểm tra trạng thái của recipient
      expect(mockIoWithOfflineRecipient.in).toHaveBeenCalledWith(mockRecipientId);
      expect(mockFetchSockets).toHaveBeenCalled();
    });

    it('should require authentication to send messages', async () => {
      const mockSocketWithoutAuth = {
        ...mockSocket,
        userId: undefined,
        emit: jest.fn()
      };

      await handleSendMessage(
        mockSocketWithoutAuth as unknown as AuthenticatedSocket,
        mockIo as Server,
        {
          conversationId: mockConversationId,
          recipientId: mockRecipientId,
          content: mockMessageContent,
          contentType: 'text'
        }
      );

      // Kiểm tra rằng đã gửi lỗi yêu cầu xác thực
      expect(mockSocketWithoutAuth.emit).toHaveBeenCalledWith('messageError', {
        message: 'Authentication required to send messages.'
      });
    });
  });

  describe('handleConnection', () => {
    it('should join user room and conversation rooms on connection', async () => {
      // Mock để trả về danh sách cuộc trò chuyện của người dùng
      const mockConversations = [
        { conversationId: 'conv1' },
        { conversationId: 'conv2' }
      ];
      (ConversationParticipant.findAll as jest.Mock).mockResolvedValue(mockConversations);

      const mockSocketWithJoin = {
        ...mockSocket,
        join: jest.fn(),
        userId: mockUserId
      };

      await handleConnection(mockSocketWithJoin as unknown as AuthenticatedSocket, mockIo as Server);

      // Kiểm tra rằng người dùng đã join room của chính họ
      expect(mockSocketWithJoin.join).toHaveBeenCalledWith(mockUserId);

      // Kiểm tra rằng người dùng đã join các phòng cuộc trò chuyện
      expect(mockSocketWithJoin.join).toHaveBeenCalledWith('conv1');
      expect(mockSocketWithJoin.join).toHaveBeenCalledWith('conv2');
    });

    it('should not join rooms if user is not authenticated', async () => {
      const mockSocketWithoutAuth = {
        ...mockSocket,
        join: jest.fn(),
        userId: undefined
      };

      await handleConnection(mockSocketWithoutAuth as unknown as AuthenticatedSocket, mockIo as Server);

      // Kiểm tra rằng không có room nào được join
      expect(mockSocketWithoutAuth.join).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should log user disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      handleDisconnect(mockSocket as unknown as AuthenticatedSocket);

      expect(consoleSpy).toHaveBeenCalledWith(`User disconnected: ${mockSocket.id} (User ID: ${mockSocket.userId})`);

      consoleSpy.mockRestore();
    });
  });
});