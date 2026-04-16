import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { env } from '../config/env';

let io: SocketServer | null = null;

export function initSockets(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  // Auth middleware — client passes token in auth handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Missing token'));
    try {
      const payload = verifyAccessToken(token);
      (socket.data as { userId: string }).userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as { userId?: string }).userId;
    if (userId) {
      socket.join(`user:${userId}`);
      // eslint-disable-next-line no-console
      console.log(`🔌 Socket connected: user ${userId}`);
    }
    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      if (userId) console.log(`🔌 Socket disconnected: user ${userId}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function getIO(): SocketServer | null {
  return io;
}
