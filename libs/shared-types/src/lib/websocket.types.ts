export const WEBSOCKET_EVENTS = {
  // Provider Connection Events
  PROVIDER_CONNECTION_STARTED: 'provider_connection_started',
  PROVIDER_CONNECTED: 'provider_connected',
  PROVIDER_CONNECTION_FAILED: 'provider_connection_failed',
  PROVIDER_DISCONNECTED: 'provider_disconnected',

  // Authentication Events
  AUTH_REQUIRED: 'auth_required',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',

  // General Events
  CONNECTION_ESTABLISHED: 'connection_established',
  CONNECTION_LOST: 'connection_lost',
  ERROR: 'error',

  // Socket Events (for internal socket communication)
  NOTIFICATION: 'notification',
  EVENT_UPDATE: 'event_update',
  EVENT_UPDATED: 'event_updated',
  PROVIDER_UPDATE: 'provider_update',
  CALENDAR_SYNC_STATUS: 'calendar_sync_status',
} as const;

export type WebSocketEventType = typeof WEBSOCKET_EVENTS[keyof typeof WEBSOCKET_EVENTS];

/**
 * WebSocket event data interfaces
 */
export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  jobId?: string;
  userId?: string;
  timestamp?: string;
}

export interface ProviderUpdateEvent {
  type:
    | typeof WEBSOCKET_EVENTS.PROVIDER_CONNECTION_STARTED
    | typeof WEBSOCKET_EVENTS.PROVIDER_CONNECTED
    | typeof WEBSOCKET_EVENTS.PROVIDER_CONNECTION_FAILED
    | typeof WEBSOCKET_EVENTS.PROVIDER_DISCONNECTED;
  providerType: string;
  providerId?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface AuthEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.AUTH_REQUIRED | typeof WEBSOCKET_EVENTS.AUTH_SUCCESS | typeof WEBSOCKET_EVENTS.AUTH_FAILED | typeof WEBSOCKET_EVENTS.AUTHENTICATED;
  message?: string;
  success?: boolean;
}

export interface ConnectionEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.CONNECTION_ESTABLISHED | typeof WEBSOCKET_EVENTS.CONNECTION_LOST;
  message?: string;
}

export interface ErrorEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.ERROR;
  message: string;
  error?: string;
}

export interface NotificationEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.NOTIFICATION;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface EventUpdateEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.EVENT_UPDATE | typeof WEBSOCKET_EVENTS.EVENT_UPDATED;
  event: any; // Event data
}

export interface CalendarSyncStatusEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.CALENDAR_SYNC_STATUS;
  provider: string;
  status: string;
  progress?: number;
}

export type WebSocketEvent = 
  | ProviderUpdateEvent
  | AuthEvent 
  | ConnectionEvent 
  | ErrorEvent 
  | NotificationEvent 
  | EventUpdateEvent 
  | CalendarSyncStatusEvent;

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  event: WebSocketEvent;
  room?: string;
}

/**
 * WebSocket authentication payload
 */
export interface WebSocketAuthPayload {
  userId: string;
  token?: string;
}
