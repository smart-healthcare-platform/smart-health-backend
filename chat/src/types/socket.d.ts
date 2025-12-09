import { Socket } from 'socket.io';

// Define a custom interface that extends the Socket interface
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient';
}

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userRole?: 'doctor' | 'patient';
  }
}