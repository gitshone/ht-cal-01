import { Router } from 'express';
import { eventsController } from './events.controller';
import { eventsValidator } from './events.validator';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(eventsValidator.getEventFilterSchema()),
  eventsController.handleAsync(
    eventsController.getEvents.bind(eventsController)
  )
);

router.post(
  '/',
  validateBody(eventsValidator.getCreateEventSchema()),
  eventsController.handleAsync(
    eventsController.createEvent.bind(eventsController)
  )
);

router.put(
  '/:id',
  validateParams(eventsValidator.getEventIdSchema()),
  validateBody(eventsValidator.getUpdateEventSchema()),
  eventsController.handleAsync(
    eventsController.updateEvent.bind(eventsController)
  )
);

router.delete(
  '/:id',
  validateParams(eventsValidator.getEventIdSchema()),
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
  validateParams(eventsValidator.getJobIdSchema()),
  eventsController.handleAsync(
    eventsController.getSyncStatus.bind(eventsController)
  )
);

export { router as eventsRoutes };
