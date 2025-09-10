import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const calendarController = new CalendarController();

// Protected routes
router.post(
  '/connect',
  authenticate,
  asyncHandler((req, res) => calendarController.connectCalendar(req, res))
);

router.delete(
  '/disconnect',
  authenticate,
  asyncHandler((req, res) => calendarController.disconnectCalendar(req, res))
);

export default router;
