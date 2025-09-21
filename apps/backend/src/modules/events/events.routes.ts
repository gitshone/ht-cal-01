import { Router } from 'express';
import { EventsController } from './events.controller';
import { EventsValidator } from './events.validator';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

export const createEventsRoutes = (
  eventsController: EventsController
): Router => {
  const router = Router();
  const validator = new EventsValidator();

  router.use(authenticate);

  router.get(
    '/',
    validateQuery(validator.getEventFilterSchema()),
    eventsController.handleAsync(
      eventsController.getEvents.bind(eventsController)
    )
  );

  router.post(
    '/',
    validateBody(validator.getCreateEventSchema()),
    eventsController.handleAsync(
      eventsController.createEvent.bind(eventsController)
    )
  );

  router.put(
    '/:id',
    validateParams(validator.getEventIdSchema()),
    validateBody(validator.getUpdateEventSchema()),
    eventsController.handleAsync(
      eventsController.updateEvent.bind(eventsController)
    )
  );

  router.delete(
    '/:id',
    validateParams(validator.getEventIdSchema()),
    eventsController.handleAsync(
      eventsController.deleteEvent.bind(eventsController)
    )
  );

  // Sync routes
  router.post(
    '/sync',
    eventsController.handleAsync(
      eventsController.syncEvents.bind(eventsController)
    )
  );

  router.get(
    '/sync/:jobId',
    validateParams(validator.getJobIdSchema()),
    eventsController.handleAsync(
      eventsController.getSyncStatus.bind(eventsController)
    )
  );

  return router;
};
