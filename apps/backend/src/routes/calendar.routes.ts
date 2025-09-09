import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const calendarController = new CalendarController();

// Protected routes
router.get('/events', authenticate, (req, res) =>
  calendarController.getEvents(req, res)
);

router.post('/connect', authenticate, (req, res) =>
  calendarController.connectCalendar(req, res)
);

router.delete('/disconnect', authenticate, (req, res) =>
  calendarController.disconnectCalendar(req, res)
);

export default router;
