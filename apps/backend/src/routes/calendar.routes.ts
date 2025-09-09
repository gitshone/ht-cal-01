import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const calendarController = new CalendarController();

// Protected routes
router.get('/events', authenticate, (req, res) =>
  calendarController.getEvents(req, res)
);

export default router;
