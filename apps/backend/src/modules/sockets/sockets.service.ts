import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { BaseService } from '../../core/base.service';
import { WebSocketEvent, WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';

export interface SyncUpdateEvent {
  type: WebSocketEvent['type'];
  userId: string;
  jobId: string;
  data?: Record<string, unknown>;
  message?: string;
}

export class SocketsService extends BaseService {
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
      this.logInfo('Client connected', { socketId: socket.id });

      // Handle user authentication
      socket.on(WEBSOCKET_EVENTS.AUTHENTICATE, (data: { userId: string }) => {
        if (data.userId) {
          this.userSockets.set(data.userId, socket.id);
          socket.join(`user_${data.userId}`);
          this.logInfo('User authenticated', {
            userId: data.userId,
            socketId: socket.id,
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.logInfo('Client disconnected', { socketId: socket.id });

        // Remove user mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            this.logInfo('User disconnected', { userId, socketId });
            break;
          }
        }
      });
    });
  }

  sendSyncUpdate(event: SyncUpdateEvent): void {
    if (!this.io) return;

    const room = `user_${event.userId}`;
    this.io.to(room).emit(WEBSOCKET_EVENTS.SYNC_UPDATE, event);

    this.logInfo('Sent sync update', {
      userId: event.userId,
      jobId: event.jobId,
      type: event.type,
      message: event.message,
    });
  }

  sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ): void {
    if (!this.io) return;

    const room = `user_${userId}`;
    this.io.to(room).emit(WEBSOCKET_EVENTS.NOTIFICATION, notification);

    this.logInfo('Sent notification', {
      userId,
      type: notification.type,
      title: notification.title,
    });
  }

  sendEventUpdate(
    userId: string,
    event: {
      type: 'event_created' | 'event_updated' | 'event_deleted';
      eventId: string;
      event?: Record<string, unknown>;
    }
  ): void {
    if (!this.io) return;

    const room = `user_${userId}`;
    this.io.to(room).emit(WEBSOCKET_EVENTS.EVENT_UPDATE, event);

    this.logInfo('Sent event update', {
      userId,
      eventId: event.eventId,
      type: event.type,
    });
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  broadcastToAll(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, data);
    this.logInfo('Broadcasted to all users', {
      event,
      dataKeys: Object.keys(data),
    });
  }

  broadcastToUsers(userIds: string[], event: string, data: any): void {
    if (!this.io) return;

    userIds.forEach(userId => {
      const room = `user_${userId}`;
      this.io!.to(room).emit(event, data);
    });

    this.logInfo('Broadcasted to specific users', {
      userIds,
      event,
      dataKeys: Object.keys(data),
    });
  }
}
