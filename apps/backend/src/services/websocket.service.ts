import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/winston-logger';

export interface SyncUpdateEvent {
  type:
    | 'sync_started'
    | 'sync_progress'
    | 'sync_completed'
    | 'sync_failed'
    | 'calendar_connection_started'
    | 'calendar_connected'
    | 'calendar_connection_failed';
  userId: string;
  jobId: string;
  data?: Record<string, unknown>;
  message?: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', socket => {
      logger.websocket('Client connected', { socketId: socket.id });

      // Handle user authentication
      socket.on('authenticate', (data: { userId: string }) => {
        if (data.userId) {
          this.userSockets.set(data.userId, socket.id);
          socket.join(`user_${data.userId}`);
          logger.websocket('User authenticated', {
            userId: data.userId,
            socketId: socket.id,
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.websocket('Client disconnected', { socketId: socket.id });

        // Remove user mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            logger.websocket('User disconnected', { userId, socketId });
            break;
          }
        }
      });
    });
  }

  /**
   * Send sync update to user
   */
  sendSyncUpdate(event: SyncUpdateEvent): void {
    if (!this.io) return;

    const room = `user_${event.userId}`;
    this.io.to(room).emit('sync_update', event);

    logger.websocket('Sent sync update', {
      userId: event.userId,
      jobId: event.jobId,
      type: event.type,
      message: event.message,
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export const webSocketService = new WebSocketService();
