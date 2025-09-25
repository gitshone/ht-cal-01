import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  WEBSOCKET_EVENTS,
  WebSocketAuthPayload,
  NotificationEvent,
  CalendarSyncStatusEvent,
} from '@ht-cal-01/shared-types';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SocketsGateway.name);
  private userSockets: Map<string, string> = new Map();

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove user mapping
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User disconnected: ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage(WEBSOCKET_EVENTS.AUTHENTICATE)
  handleAuthenticate(
    @MessageBody() data: WebSocketAuthPayload,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (data.userId) {
      client.userId = data.userId;
      this.userSockets.set(data.userId, client.id);
      client.join(`user_${data.userId}`);
      this.logger.log(`User authenticated: ${data.userId}`);

      client.emit(WEBSOCKET_EVENTS.AUTHENTICATED, { success: true });
    }
  }

  sendNotification(
    userId: string,
    notification: Omit<NotificationEvent, 'type' | 'userId' | 'timestamp'>
  ): void {
    try {
      this.server
        .to(`user_${userId}`)
        .emit(WEBSOCKET_EVENTS.NOTIFICATION, notification);
      this.logger.log(`Notification sent to user: ${userId}`, { notification });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user: ${userId}`,
        error
      );
    }
  }

  sendEventUpdate(userId: string, event: any): void {
    try {
      this.server
        .to(`user_${userId}`)
        .emit(WEBSOCKET_EVENTS.EVENT_UPDATED, event);
      this.logger.log(`Event update sent to user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send event update to user: ${userId}`,
        error
      );
    }
  }

  sendCalendarSyncStatus(
    userId: string,
    status: Omit<CalendarSyncStatusEvent, 'type' | 'userId' | 'timestamp'>
  ): void {
    try {
      this.server
        .to(`user_${userId}`)
        .emit(WEBSOCKET_EVENTS.CALENDAR_SYNC_STATUS, status);
      this.logger.log(`Calendar sync status sent to user: ${userId}`, {
        status,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send calendar sync status to user: ${userId}`,
        error
      );
    }
  }

  sendToAll(event: string, data: any): void {
    try {
      this.server.emit(event, data);
      this.logger.log(`Broadcast sent to all clients: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast to all clients: ${event}`, error);
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
