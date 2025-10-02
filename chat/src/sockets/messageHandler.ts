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
      socket.emit('messageError', { message: 'Authentication required to send messages.' });
      return;
    }

    const { conversationId, recipientId, content, contentType = 'text' } = data;

    // 1. Xác thực người gửi có quyền gửi cho người nhận
    const isParticipant = await ConversationParticipant.findOne({
      where: { conversationId, userId: socket.userId }
    });

    if (!isParticipant) {
      socket.emit('messageError', { message: 'You are not a participant of this conversation.' });
      return;
    }

    // 2. Lưu tin nhắn vào DB
    const newMessage = await Message.create({
      conversationId,
      senderId: socket.userId,
      content,
      contentType,
      isRead: false,
    });

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

    // 4. Nếu người nhận không trực tuyến, gọi Notification Service
    const recipientSockets = await io.in(recipientId).fetchSockets();
    if (recipientSockets.length === 0) {
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
    console.error('Error sending message:', error);
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

    participantConversations.forEach((participant) => {
      socket.join(participant.conversationId);
      console.log(`User ${socket.userId} joined conversation room: ${participant.conversationId}`);
    });
  }
};

/**
 * Xử lý sự kiện người dùng ngắt kết nối
 */
export const handleDisconnect = (socket: AuthenticatedSocket) => {
  console.log(`User disconnected: ${socket.id} (User ID: ${socket.userId})`);
};