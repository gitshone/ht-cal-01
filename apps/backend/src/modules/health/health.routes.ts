import { Router } from 'express';
import { healthController } from './health.controller';

const router = Router();

// Health check route
router.get(
  '/',
  healthController.handleAsync(
    healthController.healthCheck.bind(healthController)
  )
);

// Cache management routes
router.post(
  '/cache/clear',
  healthController.handleAsync(
    healthController.clearCache.bind(healthController)
  )
);

export { router as healthRoutes };
