import { AuthenticatedSocket } from '../types/socket';
import { ConversationParticipant } from '../models/conversation-participant';
import { Message } from '../models/message';
import { Server } from 'socket.io';
import axios from 'axios';

type ContentType = 'text' | 'image' | 'file';

interface SendMessageData {
  conversationId: string;
 recipientId: string;
  content: string;
  contentType?: ContentType;
}

/**
 * Xử lý sự kiện gửi tin nhắn
 */
export const handleSendMessage = async (
  socket: AuthenticatedSocket,
  io: Server,
  data: SendMessageData
) => {
  try {
    if (!socket.userId) {
      console.error('[handleSendMessage] Authentication error: socket.userId is missing.');
      socket.emit('messageError', { message: 'Authentication required to send messages.' });
      return;
    }

    const { conversationId, recipientId, content, contentType = 'text' } = data;
    console.log(`[handleSendMessage] Attempting to send message from ${socket.userId} to ${recipientId} in conversation ${conversationId}`);

    // 1. Xác thực người gửi có quyền gửi cho người nhận
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId: socket.userId }
    });

    if (!isParticipant) {
      console.warn(`[handleSendMessage] User ${socket.userId} is not a participant of conversation ${conversationId}.`);
      socket.emit('messageError', { message: 'You are not a participant of this conversation.' });
      return;
    }
    console.log(`[handleSendMessage] User ${socket.userId} is a participant of conversation ${conversationId}.`);

    // 2. Lưu tin nhắn vào DB
    const newMessage = await Message.create({
      conversationId,
      senderId: socket.userId,
      content,
      contentType,
      isRead: false,
    });
    console.log(`[handleSendMessage] Message saved to DB: ${newMessage.id}`);

    const messageData = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      content: newMessage.content,
      contentType: newMessage.contentType,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt,
    };

    // 3. Phát tin nhắn đến tất cả những người tham gia cuộc trò chuyện
    const participants = await ConversationParticipant.findAll({
      where: { conversationId }
    });

    participants.forEach(participant => {
      io.to(participant.userId).emit('receiveMessage', messageData);
    });

    // Gửi phản hồi cho người gửi
    socket.emit('messageSent', { success: true, message: messageData });

    // 4. Nếu người nhận không trực tuyến, gọi Notification Service (Tạm thời tắt)
    const recipientSockets = await io.in(recipientId).fetchSockets();
    if (process.env.NOTIFICATION_SERVICE_ENABLED === 'true' && recipientSockets.length === 0) {
      console.log(`User ${recipientId} is offline. Sending notification...`);
      try {
        await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
          userId: recipientId,
          title: 'Tin nhắn mới',
          body: `Bạn có tin nhắn mới từ ${socket.userId}: ${content}`,
          data: { conversationId: conversationId, senderId: socket.userId }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }
  } catch (error) {
    console.error('[handleSendMessage] General error:', error);
    socket.emit('messageError', { error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
};

/**
 * Xử lý sự kiện người dùng kết nối
 */
export const handleConnection = async (socket: AuthenticatedSocket, io: Server) => {
  console.log(`User connected: ${socket.id} (User ID: ${socket.userId})`);
  
  // Join room dựa trên user ID
  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`User ${socket.userId} joined room ${socket.userId}`);

    // Tham gia vào các phòng chat dựa trên conversationId mà người dùng là thành viên
    const participantConversations = await ConversationParticipant.findAll({
      where: { userId: socket.userId },
      attributes: ['conversationId'],
    });

    participantConversations.forEach(async (participant) => { // Thêm async ở đây
      socket.join(participant.conversationId);
      console.log(`Socket.IO: User ${socket.userId} joined conversation room: ${participant.conversationId}`); // Thêm log

      // Lấy tin nhắn gần đây cho các cuộc trò chuyện và gửi cho người dùng vừa kết nối
      const recentMessages = await Message.findAll({
        where: { conversationId: participant.conversationId },
        order: [['createdAt', 'ASC']], // Lấy tin nhắn theo thứ tự thời gian tăng dần
        limit: 50, // Giới hạn số lượng tin nhắn gần đây để gửi
      });
      socket.emit('recentMessages', { conversationId: participant.conversationId, messages: recentMessages });
    });
  }
};

/**
 * Xử lý sự kiện người dùng ngắt kết nối
 */
export const handleDisconnect = (socket: AuthenticatedSocket) => {
  console.log(`User disconnected: ${socket.id} (User ID: ${socket.userId})`);
};