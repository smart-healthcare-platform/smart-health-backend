import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'doctor' | 'patient';
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  try {
    const authServiceResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/verify-token`, { token });
    if (authServiceResponse.data.isValid) {
      req.userId = authServiceResponse.data.userId;
      req.userRole = authServiceResponse.data.userRole;
      next();
    } else {
      return res.sendStatus(403); // Forbidden
    }
  } catch (error) {
    console.error('Error verifying token with Auth Service:', error);
    return res.sendStatus(403); // Forbidden
  }
};

import { AuthenticatedSocket } from '../types/socket';

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: any) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const authServiceResponse = await axios.post(`${process.env.AUTH_SERVICE_URL}/verify-token`, { token });
    if (authServiceResponse.data.isValid) {
      socket.userId = authServiceResponse.data.userId;
      socket.userRole = authServiceResponse.data.userRole;
      next();
    } else {
      return next(new Error('Authentication failed'));
    }
  } catch (error) {
    console.error('Error verifying token with Auth Service:', error);
    return next(new Error('Authentication failed'));
  }
};