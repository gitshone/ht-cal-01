import { ProviderUpdateEvent, WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';
import { io, Socket } from 'socket.io-client';

export type ProviderUpdateCallback = (event: ProviderUpdateEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private providerUpdateCallbacks: ProviderUpdateCallback[] = [];
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

    this.socket.on(
      WEBSOCKET_EVENTS.PROVIDER_UPDATE,
      (event: ProviderUpdateEvent) => {
        const eventId = `provider-${event.type}-${event.providerType}-${
          event.providerId || 'unknown'
        }`;

        if (this.processedEvents.has(eventId)) {
          return;
        }

        this.processedEvents.add(eventId);

        setTimeout(() => {
          this.processedEvents.delete(eventId);
        }, 1000);

        if (this.processedEvents.size > 50) {
          const eventsArray = Array.from(this.processedEvents);
          const toRemove = eventsArray.slice(0, eventsArray.length - 50);
          toRemove.forEach(id => this.processedEvents.delete(id));
        }

        this.providerUpdateCallbacks.forEach(callback => callback(event));
      }
    );
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  onProviderUpdate(callback: ProviderUpdateCallback): () => void {
    // Prevent duplicate subscriptions
    if (!this.providerUpdateCallbacks.includes(callback)) {
      this.providerUpdateCallbacks.push(callback);
    }

    // Return unsubscribe function
    return () => {
      const index = this.providerUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.providerUpdateCallbacks.splice(index, 1);
      }
    };
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get status(): 'connecting' | 'connected' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }
}

export const webSocketService = new WebSocketService();
