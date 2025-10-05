import { Request, Response } from 'express';
import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import { Op } from 'sequelize';

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'doctor' | 'patient';
}

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const conversations = await Conversation.findAll({
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          where: { userId: userId },
          attributes: [] // Không lấy các thuộc tính của ConversationParticipant
        }
      ],
      attributes: ['id', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']], // Sắp xếp theo thời gian cập nhật của cuộc trò chuyện
    });

    // Lấy tin nhắn cuối cùng cho mỗi cuộc trò chuyện
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          where: { conversationId: conversation.id },
          order: [['createdAt', 'DESC']],
          attributes: ['content', 'createdAt'],
        });
        return {
          ...conversation.toJSON(),
          lastMessage: lastMessage ? lastMessage.toJSON() : null,
        };
      })
    );

    res.status(200).json(conversationsWithLastMessage);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId; // Người gửi yêu cầu
    const { recipientId } = req.body;
    const recipientRole = (req.body.recipientRole as string).toLowerCase(); // Chuyển đổi sang chữ thường

    console.log(`[Chat Controller] createConversation called with: userId=${userId}, recipientId=${recipientId}, recipientRole=${recipientRole}`);

    if (!userId || !recipientId || !recipientRole) {
      console.error(`[Chat Controller] createConversation: Missing credentials. userId=${userId}, recipientId=${recipientId}, recipientRole=${recipientRole}`);
      return res.status(400).json({ message: 'Missing userId, recipientId, or recipientRole.' });
    }
    if (recipientRole !== 'doctor' && recipientRole !== 'patient') {
      console.error(`[Chat Controller] createConversation: Invalid recipientRole. Received: ${req.body.recipientRole}`);
      return res.status(400).json({ message: 'Invalid recipientRole. Must be "doctor" or "patient".' });
    }

    if (userId === recipientId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself.' });
    }

    // Kiểm tra xem cuộc trò chuyện giữa hai người này đã tồn tại chưa
    // Bước 1: Tìm tất cả các cuộc trò chuyện mà người gửi tham gia
    const senderConversations = await Conversation.findAll({
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          where: { userId: userId },
          attributes: [],
          required: true,
        }
      ],
      attributes: ['id'],
    });

    // Bước 2: Lấy danh sách ID của các cuộc trò chuyện đó
    const senderConversationIds = senderConversations.map(conv => conv.id);

    // Bước 3: Trong số đó, tìm cuộc trò chuyện nào cũng có người nhận
    if (senderConversationIds.length > 0) {
      const existingConversation = await Conversation.findOne({
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: recipientId },
            attributes: [],
            required: true,
          }
        ],
        where: { id: { [Op.in]: senderConversationIds } }, // Giới hạn tìm kiếm trong các cuộc trò chuyện của người gửi
        attributes: ['id'],
      });

      if (existingConversation) {
        // Nếu cuộc trò chuyện đã tồn tại, trả về ID của nó
        return res.status(200).json({ conversationId: existingConversation.id, message: 'Conversation already exists.' });
      }
    }

    // Nếu chưa tồn tại, tạo mới
    const newConversation = await Conversation.create({});

    // Thêm người gửi và người nhận vào cuộc trò chuyện
    await ConversationParticipant.bulkCreate([
      { conversationId: newConversation.id, userId, role: req.userRole! }, // Giả sử role đã được xác thực và có sẵn
      { conversationId: newConversation.id, userId: recipientId, role: recipientRole }
    ]);

    res.status(201).json({ conversationId: newConversation.id, message: 'Conversation created successfully.' });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { before } = req.query; // Dùng cho pagination (cursor-based)

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId }
    });

    if (!isParticipant) {
      return res.status(403).json({ message: 'Forbidden: You are not a participant of this conversation.' });
    }

    let whereCondition: any = { conversationId };
    if (before) {
      whereCondition.createdAt = { [Op.lt]: new Date(before as string) };
    }

    const messages = await Message.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: 20, // Lấy 20 tin nhắn mỗi lần
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};