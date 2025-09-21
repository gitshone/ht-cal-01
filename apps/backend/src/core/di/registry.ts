import { container } from './container';
import { registerProvider } from './container';
import * as providers from './providers';
import { AuthRepository } from '../../modules/auth/auth.repository';
import { TokenBlacklistRepository } from '../../modules/auth/token-blacklist.repository';
import { EventsRepository } from '../../modules/events/events.repository';
import { CalendarRepository } from '../../modules/calendar/calendar.repository';
import { SettingsRepository } from '../../modules/settings/settings.repository';
import { GoogleOAuthRepository } from '../../modules/google-oauth/google-oauth.repository';

import { AuthService } from '../../modules/auth/auth.service';
import { EventsService } from '../../modules/events/events.service';
import { CalendarService } from '../../modules/calendar/calendar.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { FileStorageService } from '../../modules/file-storage/file-storage.service';
import { QueueService } from '../../modules/queue/queue.service';
import { BullQueueService } from '../../modules/queue/bull-queue.service';
import { SocketsService } from '../../modules/sockets/sockets.service';
import { GoogleOAuthService } from '../../modules/google-oauth/google-oauth.service';

import { AuthController } from '../../modules/auth/auth.controller';
import { EventsController } from '../../modules/events/events.controller';
import { CalendarController } from '../../modules/calendar/calendar.controller';
import { SettingsController } from '../../modules/settings/settings.controller';
import { FileStorageController } from '../../modules/file-storage/file-storage.controller';
import { QueueController } from '../../modules/queue/queue.controller';
import { HealthController } from '../../modules/health/health.controller';

import { QueueManager } from '../../modules/queue/core/queue-manager';
import { CalendarQueue } from '../../modules/queue/queues/calendar-queue';
import { SyncEventsQueue } from '../../modules/queue/queues/sync-events-queue';
import { CleanupTokensQueue } from '../../modules/queue/queues/cleanup-tokens-queue';

export function registerAllProviders(): void {
  registerProvider(providers.AUTH_REPOSITORY, AuthRepository);
  registerProvider(
    providers.TOKEN_BLACKLIST_REPOSITORY,
    TokenBlacklistRepository
  );
  registerProvider(providers.EVENTS_REPOSITORY, EventsRepository);
  registerProvider(providers.CALENDAR_REPOSITORY, CalendarRepository);
  registerProvider(providers.SETTINGS_REPOSITORY, SettingsRepository);
  registerProvider(providers.GOOGLE_OAUTH_REPOSITORY, GoogleOAuthRepository);
  registerProvider(providers.AUTH_SERVICE, AuthService, {
    deps: [
      providers.AUTH_REPOSITORY,
      providers.TOKEN_BLACKLIST_REPOSITORY,
      providers.EVENTS_REPOSITORY,
    ],
  });

  registerProvider(providers.EVENTS_SERVICE, EventsService, {
    deps: [providers.EVENTS_REPOSITORY, providers.GOOGLE_OAUTH_SERVICE],
  });

  registerProvider(providers.CALENDAR_SERVICE, CalendarService, {
    deps: [
      providers.CALENDAR_REPOSITORY,
      providers.QUEUE_SERVICE,
      providers.EVENTS_SERVICE,
    ],
  });

  registerProvider(providers.FILE_STORAGE_SERVICE, FileStorageService);

  registerProvider(providers.SETTINGS_SERVICE, SettingsService, {
    deps: [providers.SETTINGS_REPOSITORY, providers.FILE_STORAGE_SERVICE],
  });

  registerProvider(providers.QUEUE_SERVICE, QueueService, {
    deps: [providers.BULL_QUEUE_SERVICE],
  });
  registerProvider(providers.BULL_QUEUE_SERVICE, BullQueueService, {
    deps: [providers.QUEUE_MANAGER],
  });
  registerProvider(providers.SOCKETS_SERVICE, SocketsService);
  registerProvider(providers.GOOGLE_OAUTH_SERVICE, GoogleOAuthService, {
    deps: [providers.GOOGLE_OAUTH_REPOSITORY],
  });

  registerProvider(providers.QUEUE_MANAGER, QueueManager, {
    deps: [
      providers.GOOGLE_OAUTH_SERVICE,
      providers.EVENTS_SERVICE,
      providers.SOCKETS_SERVICE,
      providers.TOKEN_BLACKLIST_REPOSITORY,
    ],
  });

  registerProvider(providers.CALENDAR_QUEUE, CalendarQueue, {
    deps: [providers.GOOGLE_OAUTH_SERVICE, providers.EVENTS_SERVICE],
  });

  registerProvider(providers.SYNC_EVENTS_QUEUE, SyncEventsQueue, {
    deps: [providers.EVENTS_SERVICE],
  });

  registerProvider(providers.CLEANUP_TOKENS_QUEUE, CleanupTokensQueue);

  registerProvider(providers.AUTH_CONTROLLER, AuthController, {
    deps: [providers.AUTH_SERVICE],
  });

  registerProvider(providers.EVENTS_CONTROLLER, EventsController, {
    deps: [providers.EVENTS_SERVICE, providers.QUEUE_SERVICE],
  });

  registerProvider(providers.CALENDAR_CONTROLLER, CalendarController, {
    deps: [providers.CALENDAR_SERVICE],
  });

  registerProvider(providers.SETTINGS_CONTROLLER, SettingsController, {
    deps: [providers.SETTINGS_SERVICE],
  });

  registerProvider(providers.FILE_STORAGE_CONTROLLER, FileStorageController, {
    deps: [providers.FILE_STORAGE_SERVICE],
  });

  registerProvider(providers.QUEUE_CONTROLLER, QueueController, {
    deps: [providers.QUEUE_SERVICE],
  });

  registerProvider(providers.HEALTH_CONTROLLER, HealthController);
}

export function getService<T>(token: symbol): T {
  return container.resolve<T>(token);
}

export function getController<T>(token: symbol): T {
  return container.resolve<T>(token);
}

export function getRepository<T>(token: symbol): T {
  return container.resolve<T>(token);
}
