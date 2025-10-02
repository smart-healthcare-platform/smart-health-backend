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

// Import các hàm xử lý socket
import { handleConnection, handleSendMessage, handleDisconnect } from './sockets/messageHandler';

// Kết nối Socket.IO
io.on('connection', async (socket: AuthenticatedSocket) => {
  // Xử lý kết nối
  await handleConnection(socket, io);
  
  // Xử lý sự kiện gửi tin nhắn
  socket.on('sendMessage', async (data) => {
    await handleSendMessage(socket, io, data);
  });
  
 // Xử lý sự kiện khi người dùng ngắt kết nối
  socket.on('disconnect', () => {
    handleDisconnect(socket);
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
