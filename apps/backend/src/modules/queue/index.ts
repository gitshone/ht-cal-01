import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { createQueueRoutes } from './queue.routes';
import { BullQueueService } from './bull-queue.service';
import { QueueManager } from './core/queue-manager';
import { GoogleOAuthService } from '../google-oauth/google-oauth.service';
import { GoogleOAuthRepository } from '../google-oauth/google-oauth.repository';
import { EventsService } from '../events/events.service';
import { EventsRepository } from '../events/events.repository';
import { SocketsService } from '../sockets/sockets.service';
import { TokenBlacklistRepository } from '../auth/token-blacklist.repository';

export const createQueueModule = () => {
  const eventsRepository = new EventsRepository();
  const googleOAuthRepository = new GoogleOAuthRepository();
  const googleOAuthService = new GoogleOAuthService(googleOAuthRepository);
  const socketsService = new SocketsService();
  const tokenBlacklistRepository = new TokenBlacklistRepository();
  const eventsService = new EventsService(eventsRepository, googleOAuthService);
  const queueManager = new QueueManager(
    googleOAuthService,
    eventsService,
    socketsService,
    tokenBlacklistRepository
  );
  const bullQueueService = new BullQueueService(queueManager);
  const queueService = new QueueService(bullQueueService);
  const queueController = new QueueController(queueService);
  const queueRoutes = createQueueRoutes(queueController);

  return {
    service: queueService,
    controller: queueController,
    routes: queueRoutes,
  };
};

export { QueueManager, BaseQueue } from './core';

export { SyncEventsQueue, CalendarQueue, CleanupTokensQueue } from './queues';
