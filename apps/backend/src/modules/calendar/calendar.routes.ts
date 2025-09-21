import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const createCalendarRoutes = (
  calendarController: CalendarController
): Router => {
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

  return router;
};
