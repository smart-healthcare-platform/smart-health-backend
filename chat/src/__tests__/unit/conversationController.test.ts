import { getConversations } from '../../api/controllers/conversationController';
import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth'; // Import AuthenticatedRequest

// Mock Sequelize models
jest.mock('../../models/conversation');
jest.mock('../../models/conversation-participant');
jest.mock('../../models/message');

describe('Conversation Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>; // Sử dụng AuthenticatedRequest
  let mockResponse: Partial<Response>;
  let responseStatus: number;
  let responseJson: any;

  beforeEach(() => {
    mockRequest = {
      userId: 'testUserId',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseJson = data;
        return mockResponse;
      }),
    };
    responseStatus = 200; // Default status
    responseJson = null; // Reset json
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should return 401 if userId is not provided', async () => {
      mockRequest.userId = undefined;

      await getConversations(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseJson).toEqual({ message: 'User not authenticated.' });
    });

    it('should return a list of conversations for the authenticated user', async () => {
      const mockConversation = {
        id: 'conv1',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: jest.fn().mockReturnValue({ id: 'conv1', createdAt: new Date(), updatedAt: new Date() })
      };
      const mockConversations = [mockConversation];

      (Conversation.findAll as jest.Mock).mockResolvedValue(mockConversations);
      (Message.findOne as jest.Mock).mockResolvedValue({
        content: 'Hello',
        createdAt: new Date(),
        toJSON: jest.fn().mockReturnValue({ content: 'Hello', createdAt: new Date() })
      });

      await getConversations(mockRequest as Request, mockResponse as Response);

      expect(Conversation.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: 'testUserId' },
            attributes: [], // Không lấy các thuộc tính của ConversationParticipant
          }
        ],
        attributes: ['id', 'createdAt', 'updatedAt'],
        order: [['updatedAt', 'DESC']], // Sắp xếp theo thời gian cập nhật của cuộc trò chuyện
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      // Kiểm tra rằng responseJson có chứa các cuộc trò chuyện với lastMessage
      expect(responseJson).toEqual([
        expect.objectContaining({
          id: 'conv1',
          lastMessage: expect.objectContaining({ content: 'Hello' })
        })
      ]);
    });

    it('should handle errors during conversation fetching', async () => {
      const errorMessage = 'Database error';
      (Conversation.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await getConversations(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(responseJson).toEqual({ message: 'Internal server error.' });
    });
  });
});