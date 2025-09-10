import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateQuery,
  validateBody,
  validateParams,
} from '../middleware/validation.middleware';
import {
  eventFilterSchema,
  createEventSchema,
  updateEventSchema,
  jobIdSchema,
  eventIdSchema,
} from '../schemas/event.schemas';

const router = Router();
const eventController = new EventController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Event routes with Joi validation
router.get(
  '/',
  validateQuery(eventFilterSchema),
  asyncHandler(eventController.getEvents.bind(eventController))
);

router.post(
  '/',
  validateBody(createEventSchema),
  asyncHandler(eventController.createEvent.bind(eventController))
);

router.put(
  '/:id',
  validateParams(eventIdSchema),
  validateBody(updateEventSchema),
  asyncHandler(eventController.updateEvent.bind(eventController))
);

router.delete(
  '/:id',
  validateParams(eventIdSchema),
  asyncHandler(eventController.deleteEvent.bind(eventController))
);

router.post(
  '/sync',
  asyncHandler(eventController.syncEvents.bind(eventController))
);

router.get(
  '/sync/:jobId',
  validateParams(jobIdSchema),
  asyncHandler(eventController.getSyncStatus.bind(eventController))
);

export default router;
