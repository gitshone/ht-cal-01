/**
 * WebSocket event types used across frontend and backend
 * This ensures consistency and prevents typos in event names
 */

export const WEBSOCKET_EVENTS = {
  // Sync Events
  SYNC_STARTED: 'sync_started',
  SYNC_PROGRESS: 'sync_progress',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',

  // Calendar Connection Events
  CALENDAR_CONNECTION_STARTED: 'calendar_connection_started',
  CALENDAR_CONNECTED: 'calendar_connected',
  CALENDAR_CONNECTION_FAILED: 'calendar_connection_failed',

  // Authentication Events
  AUTH_REQUIRED: 'auth_required',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',

  // General Events
  CONNECTION_ESTABLISHED: 'connection_established',
  CONNECTION_LOST: 'connection_lost',
  ERROR: 'error',

  // Socket Events (for internal socket communication)
  AUTHENTICATE: 'authenticate',
  SYNC_UPDATE: 'sync_update',
  NOTIFICATION: 'notification',
  EVENT_UPDATE: 'event_update',
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

export interface SyncEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.SYNC_STARTED | typeof WEBSOCKET_EVENTS.SYNC_PROGRESS | typeof WEBSOCKET_EVENTS.SYNC_COMPLETED | typeof WEBSOCKET_EVENTS.SYNC_FAILED;
  message?: string;
  data?: {
    synced?: number;
    created?: number;
    updated?: number;
    progress?: number;
  };
}

export interface CalendarConnectionEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.CALENDAR_CONNECTION_STARTED | typeof WEBSOCKET_EVENTS.CALENDAR_CONNECTED | typeof WEBSOCKET_EVENTS.CALENDAR_CONNECTION_FAILED;
  message?: string;
  data?: {
    connected?: boolean;
    synced?: number;
    created?: number;
    updated?: number;
  };
}

export interface AuthEvent extends BaseWebSocketEvent {
  type: typeof WEBSOCKET_EVENTS.AUTH_REQUIRED | typeof WEBSOCKET_EVENTS.AUTH_SUCCESS | typeof WEBSOCKET_EVENTS.AUTH_FAILED;
  message?: string;
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

export type WebSocketEvent = SyncEvent | CalendarConnectionEvent | AuthEvent | ConnectionEvent | ErrorEvent;

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
