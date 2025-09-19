import { Router } from 'express';

import { authRoutes } from '../modules/auth';
import { calendarRoutes } from '../modules/calendar';
import { eventsRoutes } from '../modules/events';
import { queueRoutes } from '../modules/queue';
import { healthRoutes } from '../modules/health';

const router = Router();

// API routes
router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/calendar', calendarRoutes);
router.use('/api/events', eventsRoutes);
router.use('/api/queue', queueRoutes);

export default router;
