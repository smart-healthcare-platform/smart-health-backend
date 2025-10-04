import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'doctor' | 'patient';
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Tin tưởng thông tin người dùng đã được xác thực từ API Gateway
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as 'doctor' | 'patient';

  if (!userId || !userRole) {
    console.error('Authentication error: Missing X-User-ID or X-User-Role headers from API Gateway.');
    return res.status(403).json({ message: 'Forbidden: Missing user credentials.' });
  }

  // Gán thông tin người dùng vào request để các controller sau có thể sử dụng
  req.userId = userId;
  req.userRole = userRole;

  next();
};

import { AuthenticatedSocket } from '../types/socket';

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: any) => {
  let token = socket.handshake.auth.token;

  // Ưu tiên lấy token từ header Authorization (Bearer token)
  if (!token && socket.handshake.headers.authorization) {
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    console.error('Socket.IO: Authentication token required.');
    return next(new Error('Authentication token required'));
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('Socket.IO: JWT_SECRET is not defined.');
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role.toLowerCase(); // Chuyển đổi thành 'doctor' hoặc 'patient'
    console.log(`Socket.IO: User ${socket.userId} (${socket.userRole}) authenticated.`);
    next();
  } catch (error: any) {
    console.error('Socket.IO: Error verifying token:', error);
    return next(new Error('Authentication failed: ' + error.message));
  }
};