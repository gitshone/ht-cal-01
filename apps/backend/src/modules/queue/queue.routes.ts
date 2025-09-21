import { Router } from 'express';
import { QueueController } from './queue.controller';
import { QueueValidator } from './queue.validator';
import {
  validateBody,
  validateParams,
} from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

export const createQueueRoutes = (queueController: QueueController): Router => {
  const router = Router();
  const validator = new QueueValidator();

  router.use(authenticate);

  router.get(
    '/job/:jobId',
    validateParams(validator.getJobIdSchema()),
    queueController.handleAsync(
      queueController.getJobStatus.bind(queueController)
    )
  );

  router.post(
    '/job',
    validateBody(validator.getAddJobSchema()),
    queueController.handleAsync(queueController.addJob.bind(queueController))
  );

  router.post(
    '/connect-calendar',
    validateBody(validator.getConnectCalendarSchema()),
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
    validateParams(validator.getQueueNameSchema()),
    queueController.handleAsync(
      queueController.pauseQueue.bind(queueController)
    )
  );

  router.post(
    '/resume/:queueName',
    validateParams(validator.getQueueNameSchema()),
    queueController.handleAsync(
      queueController.resumeQueue.bind(queueController)
    )
  );

  return router;
};
