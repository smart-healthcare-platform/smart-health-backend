import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from './types/socket';
import cors from 'cors';
import helmet from 'helmet';
import { Sequelize } from 'sequelize';
import * as dbConfig from './config/database.js';
import axios from 'axios'; // Import axios
import conversationRoutes from './api/routes/conversationRoutes';

// Import các mô hình
import { Conversation } from './models/conversation';
import { ConversationParticipant } from './models/conversation-participant';
import { Message } from './models/message';

// Hàm khởi tạo models
const initializeModels = (sequelizeInstance: Sequelize) => {
  Conversation.initModel(sequelizeInstance);
  ConversationParticipant.initModel(sequelizeInstance);
  Message.initModel(sequelizeInstance);

  // Thiết lập mối quan hệ
  Conversation.associate(sequelizeInstance.models);
  ConversationParticipant.associate(sequelizeInstance.models);
  Message.associate(sequelizeInstance.models);
};

type Environment = 'development' | 'test' | 'production';
 
interface DbConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  dialect?: string;
  dialectOptions?: object; // Thêm dialectOptions vào kiểu
}

const env = (process.env.NODE_ENV as Environment) || 'development';
const config: DbConfig = dbConfig[env]; // Ép kiểu config

if (!config.database || !config.username || !config.host) {
  throw new Error(
    'Database configuration is incomplete. Please check your .env file.'
  );
}

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: env === 'development' ? console.log : false, // Chỉ dùng trong dev
  ...(config.dialectOptions ? { dialectOptions: config.dialectOptions } : {}), // Thêm dialectOptions nếu có
});

// Thiết lập Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet()); // Tăng cường bảo mật
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Cho phép từ frontend
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Thiết lập Socket.IO
import { socketAuthMiddleware } from './middleware/auth';

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware xác thực JWT cho Socket.IO
io.use(socketAuthMiddleware);

// Route API cơ bản
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Chat Service' });
});

// Sử dụng các route API
app.use('/api', conversationRoutes);

// Thêm một route API mẫu có xác thực
// app.get('/api/conversations', authenticateToken, (req: AuthenticatedRequest, res) => {
//   // Logic để lấy danh sách cuộc trò chuyện của người dùng đã xác thực
//   res.status(200).json({ message: `Conversations for user ${req.userId}` });
// });

// Kết nối Socket.IO
io.on('connection', async (socket: AuthenticatedSocket) => {
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
  
  // Xử lý sự kiện gửi tin nhắn
  socket.on('sendMessage', async ({ conversationId, recipientId, content, contentType = 'text' }) => {
    try {
      if (!socket.userId) {
        socket.emit('messageError', { message: 'Authentication required to send messages.' });
        return;
      }

      // 1. Xác thực người gửi có quyền gửi cho người nhận (đây là một placeholder đơn giản)
      // Trong thực tế, bạn sẽ kiểm tra xem senderId có phải là một participant của conversationId không.
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
      
      console.log(`Message sent in conversation ${conversationId} from ${socket.userId} to ${recipientId}`);
      
      // Gửi phản hồi cho người gửi
      socket.emit('messageSent', { success: true, message: messageData });
      
      // 4. Nếu người nhận không trực tuyến, gọi Notification Service
      // Kiểm tra xem người nhận có đang online không bằng cách xem họ có trong bất kỳ phòng nào không
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
  });
  
  // Xử lý sự kiện khi người dùng ngắt kết nối
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} (User ID: ${socket.userId})`);
  });
});

// Hàm để gửi tin nhắn đến người nhận
export const sendToUser = (userId: string, event: string, data: any) => {
  io.to(userId).emit(event, data);
};

// Hàm kiểm tra kết nối cơ sở dữ liệu
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Hàm đồng bộ hóa cơ sở dữ liệu
export const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.sync({ force }); // Sử dụng 'force' trong test, 'alter' trong dev
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to sync database:', error);
  }
};

// Khởi động server
const PORT = process.env.PORT || 3001;

if (env !== 'test') { // Chỉ lắng nghe cổng khi không phải môi trường test
  server.listen(PORT, async () => {
    console.log(`Chat Service is running on port ${PORT}`);
    
    // Khởi tạo models trước khi kiểm tra kết nối và đồng bộ hóa
    initializeModels(sequelize);

    // Kiểm tra kết nối cơ sở dữ liệu
    await testConnection();
    
    // Đồng bộ hóa cơ sở dữ liệu (chỉ trong môi trường dev)
    if (env === 'development') {
      await syncDatabase();
    }
  });
}

// Khởi tạo models cho các test
initializeModels(sequelize);

export { app, server, sequelize, initializeModels };
