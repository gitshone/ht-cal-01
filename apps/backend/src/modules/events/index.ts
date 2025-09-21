import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { createEventsRoutes } from './events.routes';
import { GoogleOAuthService } from '../google-oauth/google-oauth.service';
import { GoogleOAuthRepository } from '../google-oauth/google-oauth.repository';
import { QueueService } from '../queue/queue.service';
import { BullQueueService } from '../queue/bull-queue.service';
import { QueueManager } from '../queue/core/queue-manager';
import { SocketsService } from '../sockets/sockets.service';
import { TokenBlacklistRepository } from '../auth/token-blacklist.repository';

export const createEventsModule = () => {
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
  const eventsController = new EventsController(eventsService, queueService);
  const eventsRoutes = createEventsRoutes(eventsController);

  return {
    repository: eventsRepository,
    service: eventsService,
    controller: eventsController,
    routes: eventsRoutes,
  };
};
