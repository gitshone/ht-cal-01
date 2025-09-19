import { Router } from 'express';
import { queueController } from './queue.controller';
import { queueValidator } from './queue.validator';
import {
  validateBody,
  validateParams,
} from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/job/:jobId',
  validateParams(queueValidator.getJobIdSchema()),
  queueController.handleAsync(
    queueController.getJobStatus.bind(queueController)
  )
);

router.post(
  '/job',
  validateBody(queueValidator.getAddJobSchema()),
  queueController.handleAsync(queueController.addJob.bind(queueController))
);

router.post(
  '/connect-calendar',
  validateBody(queueValidator.getConnectCalendarSchema()),
  queueController.handleAsync(
    queueController.connectCalendar.bind(queueController)
  )
);

router.get(
  '/stats',
  queueController.handleAsync(
    queueController.getQueueStats.bind(queueController)
  )
);

router.post(
  '/pause/:queueName',
  validateParams(queueValidator.getQueueNameSchema()),
  queueController.handleAsync(queueController.pauseQueue.bind(queueController))
);

router.post(
  '/resume/:queueName',
  validateParams(queueValidator.getQueueNameSchema()),
  queueController.handleAsync(queueController.resumeQueue.bind(queueController))
);

export { router as queueRoutes };
