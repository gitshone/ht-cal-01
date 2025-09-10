import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import calendarRoutes from './calendar.routes';
import eventRoutes from './event.routes';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import logger from '../utils/winston-logger';

const router = Router();

// Health check endpoint
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/calendar', calendarRoutes);
router.use('/api/events', eventRoutes);

export default router;
