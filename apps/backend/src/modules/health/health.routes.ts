import { Router } from 'express';
import { HealthController } from './health.controller';

export const createHealthRoutes = (
  healthController: HealthController
): Router => {
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

  return router;
};
