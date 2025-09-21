import { CalendarRepository } from './calendar.repository';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { createCalendarRoutes } from './calendar.routes';
import { QueueService } from '../queue/queue.service';
import { BullQueueService } from '../queue/bull-queue.service';
import { QueueManager } from '../queue/core/queue-manager';
import { GoogleOAuthService } from '../google-oauth/google-oauth.service';
import { GoogleOAuthRepository } from '../google-oauth/google-oauth.repository';
import { EventsService } from '../events/events.service';
import { EventsRepository } from '../events/events.repository';
import { SocketsService } from '../sockets/sockets.service';
import { TokenBlacklistRepository } from '../auth/token-blacklist.repository';

export const createCalendarModule = () => {
  const calendarRepository = new CalendarRepository();
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
  const calendarService = new CalendarService(
    calendarRepository,
    queueService,
    eventsService
  );
  const calendarController = new CalendarController(calendarService);
  const calendarRoutes = createCalendarRoutes(calendarController);

  return {
    repository: calendarRepository,
    service: calendarService,
    controller: calendarController,
    routes: calendarRoutes,
  };
};
