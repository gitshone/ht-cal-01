import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/connect',
  calendarController.handleAsync(
    calendarController.connectCalendar.bind(calendarController)
  )
);

router.delete(
  '/disconnect',
  calendarController.handleAsync(
    calendarController.disconnectCalendar.bind(calendarController)
  )
);

router.get(
  '/status',
  calendarController.handleAsync(
    calendarController.getConnectionStatus.bind(calendarController)
  )
);

export { router as calendarRoutes };
