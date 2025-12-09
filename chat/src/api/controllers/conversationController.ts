import { Request, Response } from 'express';
import { Conversation } from '../../models/conversation';
import { ConversationParticipant } from '../../models/conversation-participant';
import { Message } from '../../models/message';
import { Op } from 'sequelize';
import { fetchUserInfo, fetchUserIdByEntityId } from '../../utils/userInfoFetcher';

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

    // Vô hiệu hóa cache cho endpoint này
    res.set('Cache-Control', 'no-store');

    // Bước 1: Lấy các conversationId mà người dùng là thành viên
    const userConversationIds = await ConversationParticipant.findAll({
      where: { userId: userId },
      attributes: ['conversationId'],
      raw: true, // Trả về mảng các object đơn giản thay vì instance của model
    }).then(participants => participants.map(p => p.conversationId));

    if (userConversationIds.length === 0) {
      // Nếu người dùng không có cuộc trò chuyện nào, trả về mảng rỗng
      return res.status(200).json([]);
    }

    // Bước 2: Lấy thông tin cuộc trò chuyện và tất cả participants
    const conversations = await Conversation.findAll({
      where: { id: { [Op.in]: userConversationIds } }, // Chỉ lấy các cuộc trò chuyện mà người dùng là thành viên
      include: [
        {
          model: ConversationParticipant,
          as: 'participants',
          attributes: ['id', 'userId', 'role', 'fullName'] // Lấy tất cả participants, không giới hạn bởi userId
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
          attributes: ['content', 'createdAt', 'senderId'], // Thêm senderId nếu cần
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
    const userId = req.userId; // Người gửi yêu cầu (user_id của người gửi)
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
          where: { userId: userId }, // userId là user_id của người gửi
          attributes: [],
          required: true,
        }
      ],
      attributes: ['id'],
    });

    // Bước 2: Lấy danh sách ID của các cuộc trò chuyện đó
    const senderConversationIds = senderConversations.map(conv => conv.id);

    // Bước 3: Trong số đó, tìm cuộc trò chuyện nào cũng có người nhận
    // Để tìm người nhận, ta cần biết user_id thực sự của họ, không phải entity ID nếu recipientId là entity ID
    let recipientUserId = recipientId;
    if (recipientId !== userId) { // Nếu recipientId khác userId của người gửi, có thể nó là entity ID
      // Cố gắng lấy user_id của người nhận nếu recipientId là entity ID
      const fetchedRecipientUserId = await fetchUserIdByEntityId(recipientId, recipientRole);
      if (fetchedRecipientUserId) {
        console.log(`[Chat Controller] Fetched user_id ${fetchedRecipientUserId} for entity ID ${recipientId} (role: ${recipientRole})`);
        recipientUserId = fetchedRecipientUserId;
      } else {
        console.log(`[Chat Controller] Could not fetch user_id for entity ID ${recipientId}, assuming it's user_id.`);
        // Nếu không tìm thấy, giả định recipientId là user_id
        recipientUserId = recipientId;
      }
    }

    if (senderConversationIds.length > 0) {
      const existingConversation = await Conversation.findOne({
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            where: { userId: recipientUserId }, // Dùng user_id đã xác định
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

    // Lấy full_name cho cả hai người tham gia
    // req.userRole có thể là DOCTOR hoặc PATIENT (chữ hoa), recipientRole là lowercase (doctor, patient)
    const senderFullName = await fetchUserInfo(userId, req.userRole!);
    const recipientFullName = await fetchUserInfo(recipientId, recipientRole); // Vẫn dùng recipientId (entity ID) để lấy tên

    // Thêm người gửi và người nhận vào cuộc trò chuyện, bao gồm cả full_name
    // Dùng userId (user_id của người gửi) và recipientUserId (user_id của người nhận) cho trường userId
    await ConversationParticipant.bulkCreate([
      { conversationId: newConversation.id, userId, role: req.userRole!, fullName: senderFullName || 'Unknown' }, // userId của người gửi
      { conversationId: newConversation.id, userId: recipientUserId, role: recipientRole, fullName: recipientFullName || 'Unknown' } // userId của người nhận
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