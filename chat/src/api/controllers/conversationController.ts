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