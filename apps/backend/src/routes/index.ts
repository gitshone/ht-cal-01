import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import calendarRoutes from './calendar.routes';
import { prisma } from '../lib/prisma';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/calendar', calendarRoutes);

export default router;
