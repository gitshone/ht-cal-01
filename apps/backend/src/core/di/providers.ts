export const AUTH_REPOSITORY = Symbol('AuthRepository');
export const TOKEN_BLACKLIST_REPOSITORY = Symbol('TokenBlacklistRepository');
export const EVENTS_REPOSITORY = Symbol('EventsRepository');
export const CALENDAR_REPOSITORY = Symbol('CalendarRepository');
export const SETTINGS_REPOSITORY = Symbol('SettingsRepository');
export const GOOGLE_OAUTH_REPOSITORY = Symbol('GoogleOAuthRepository');
export const AUTH_SERVICE = Symbol('AuthService');
export const EVENTS_SERVICE = Symbol('EventsService');
export const CALENDAR_SERVICE = Symbol('CalendarService');
export const SETTINGS_SERVICE = Symbol('SettingsService');
export const FILE_STORAGE_SERVICE = Symbol('FileStorageService');
export const QUEUE_SERVICE = Symbol('QueueService');
export const BULL_QUEUE_SERVICE = Symbol('BullQueueService');
export const SOCKETS_SERVICE = Symbol('SocketsService');
export const GOOGLE_OAUTH_SERVICE = Symbol('GoogleOAuthService');

export const AUTH_CONTROLLER = Symbol('AuthController');
export const EVENTS_CONTROLLER = Symbol('EventsController');
export const CALENDAR_CONTROLLER = Symbol('CalendarController');
export const SETTINGS_CONTROLLER = Symbol('SettingsController');
export const FILE_STORAGE_CONTROLLER = Symbol('FileStorageController');
export const QUEUE_CONTROLLER = Symbol('QueueController');
export const HEALTH_CONTROLLER = Symbol('HealthController');

export const QUEUE_MANAGER = Symbol('QueueManager');

export const CALENDAR_QUEUE = Symbol('CalendarQueue');
export const SYNC_EVENTS_QUEUE = Symbol('SyncEventsQueue');
export const CLEANUP_TOKENS_QUEUE = Symbol('CleanupTokensQueue');
