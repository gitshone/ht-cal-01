import { io, Socket } from 'socket.io-client';
import { WebSocketEvent, WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';

export interface SyncUpdateEvent {
  type: WebSocketEvent['type'];
  userId: string;
  jobId: string;
  data?: Record<string, unknown>;
  message?: string;
}

export type SyncUpdateCallback = (event: SyncUpdateEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private syncUpdateCallbacks: SyncUpdateCallback[] = [];
  private processedEvents = new Set<string>();

  connect(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socket?.emit(WEBSOCKET_EVENTS.AUTHENTICATE, { userId });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', error => {
      this.isConnected = false;
    });

    this.socket.on(WEBSOCKET_EVENTS.SYNC_UPDATE, (event: SyncUpdateEvent) => {
      // Create unique event ID to prevent duplicate processing
      const eventId = `${event.type}-${event.jobId}-${event.userId}`;

      if (this.processedEvents.has(eventId)) {
        return;
      }

      // Mark event as processed
      this.processedEvents.add(eventId);

      // Remove event from processed set after 1 second to allow future events
      setTimeout(() => {
        this.processedEvents.delete(eventId);
      }, 1000);

      // Clean up old processed events
      if (this.processedEvents.size > 50) {
        const eventsArray = Array.from(this.processedEvents);
        const toRemove = eventsArray.slice(0, eventsArray.length - 50);
        toRemove.forEach(id => this.processedEvents.delete(id));
      }

      // Process event
      this.syncUpdateCallbacks.forEach(callback => callback(event));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to sync updates
   */
  onSyncUpdate(callback: SyncUpdateCallback): () => void {
    // Prevent duplicate subscriptions
    if (!this.syncUpdateCallbacks.includes(callback)) {
      this.syncUpdateCallbacks.push(callback);
    }

    // Return unsubscribe function
    return () => {
      const index = this.syncUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  get status(): 'connecting' | 'connected' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }
}

export const webSocketService = new WebSocketService();
