import { AuthenticatedSocket } from '../types/socket';
import { ConversationParticipant } from '../models/conversation-participant';
import { Message } from '../models/message';
import { Server } from 'socket.io';
import { fetchUserInfo } from '../utils/userInfoFetcher';
import { chatProducer } from '../kafka/chat-producer.service';

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

    // 4. Lấy userId thực của recipient (có thể nhận participant ID từ frontend)
    let actualRecipientUserId = recipientId;
    
    // Kiểm tra xem recipientId có phải là participant ID không
    const recipientParticipant = await ConversationParticipant.findOne({
      where: { id: recipientId }
    });
    
    if (recipientParticipant) {
      // recipientId là participant ID, lấy userId thực
      actualRecipientUserId = recipientParticipant.userId;
      console.log(`[handleSendMessage] Resolved participant ID ${recipientId} to userId ${actualRecipientUserId}`);
    }

    // 5. Smart notification: Gửi push notification nếu user offline HOẶC không active trong conversation này
    const recipientSockets = await io.in(actualRecipientUserId).fetchSockets();
    const isOnline = recipientSockets.length > 0;
    
    // Kiểm tra xem user có đang active trong conversation này không
    let isActiveInConversation = false;
    if (isOnline) {
      // Kiểm tra socket có join vào room conversation này không
      const conversationRoom = await io.in(conversationId).fetchSockets();
      isActiveInConversation = conversationRoom.some(s => (s as any).userId === actualRecipientUserId);
    }

    // Chỉ gửi push notification nếu:
    // - User offline (không có socket), HOẶC
    // - User online nhưng KHÔNG đang xem conversation này
    const shouldNotify = !isOnline || !isActiveInConversation;
    
    if (shouldNotify) {
      const status = !isOnline ? 'offline' : 'online but not viewing this conversation';
      console.log(`[handleSendMessage] User ${actualRecipientUserId} is ${status}. Publishing Kafka event for push notification...`);
      
      try {
        // Lấy role và tên thực của người gửi từ participant
        const senderParticipant = await ConversationParticipant.findOne({
          where: { conversationId, userId: socket.userId }
        });
        
        let senderName = socket.userId; // fallback to userId
        
        if (senderParticipant) {
          // Nếu đã có fullName trong participant, dùng luôn
          if (senderParticipant.fullName) {
            senderName = senderParticipant.fullName;
          } else {
            // Nếu chưa có, fetch từ service tương ứng
            const senderRole = senderParticipant.role.toUpperCase(); // 'doctor' -> 'DOCTOR', 'patient' -> 'PATIENT'
            const fetchedName = await fetchUserInfo(socket.userId, senderRole);
            senderName = fetchedName || socket.userId;
            
            // Lưu lại fullName vào participant để lần sau không phải fetch nữa
            if (fetchedName) {
              await ConversationParticipant.update(
                { fullName: fetchedName },
                { where: { id: senderParticipant.id } }
              );
            }
          }
        }

        await chatProducer.publishNewMessageEvent({
          recipientId: actualRecipientUserId,
          senderId: socket.userId,
          senderName: senderName,
          messageContent: content,
          conversationId: conversationId,
        });

        console.log(`[handleSendMessage] Kafka event published successfully for user ${actualRecipientUserId}`);
      } catch (kafkaError: any) {
        console.error('[handleSendMessage] Error publishing Kafka event:', kafkaError.message);
      }
    } else {
      console.log(`[handleSendMessage] User ${actualRecipientUserId} is actively viewing conversation. Skipping push notification.`);
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
      attributes: ['conversationId', 'userId', 'role', 'fullName'], // Lấy thêm thông tin để kiểm tra
    });

    for (const participant of participantConversations) { // Sử dụng for...of để đảm bảo async/await hoạt động đúng
      socket.join(participant.conversationId);
      console.log(`Socket.IO: User ${socket.userId} joined conversation room: ${participant.conversationId}`); // Thêm log

      // Kiểm tra nếu fullName bị thiếu, cập nhật nó
      if (!participant.fullName) {
        const userType = participant.role; // role có thể là 'DOCTOR', 'PATIENT', 'doctor', 'patient'
        const fullName = await fetchUserInfo(participant.userId, userType); // fetchUserInfo xử lý cả chữ hoa/thường
        if (fullName) {
          await ConversationParticipant.update(
            { fullName: fullName },
            { where: { id: participant.id } } // Cập nhật theo ID của participant
          );
          console.log(`Updated fullName for participant ${participant.userId} in conversation ${participant.conversationId}`);
        } else {
          console.warn(`Could not fetch fullName for participant ${participant.userId} in conversation ${participant.conversationId}`);
        }
      }

      // Lấy tin nhắn gần đây cho các cuộc trò chuyện và gửi cho người dùng vừa kết nối
      const recentMessages = await Message.findAll({
        where: { conversationId: participant.conversationId },
        order: [['createdAt', 'ASC']], // Lấy tin nhắn theo thứ tự thời gian tăng dần
        limit: 50, // Giới hạn số lượng tin nhắn gần đây để gửi
      });
      socket.emit('recentMessages', { conversationId: participant.conversationId, messages: recentMessages });
    }
  }
};

/**
 * Xử lý sự kiện người dùng ngắt kết nối
 */
export const handleDisconnect = (socket: AuthenticatedSocket) => {
  console.log(`User disconnected: ${socket.id} (User ID: ${socket.userId})`);
};