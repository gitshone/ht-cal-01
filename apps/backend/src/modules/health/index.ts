import { HealthController } from './health.controller';
import { createHealthRoutes } from './health.routes';

export const createHealthModule = () => {
  const healthController = new HealthController();
  const healthRoutes = createHealthRoutes(healthController);

  return {
    controller: healthController,
    routes: healthRoutes,
  };
};

// Legacy exports for backward compatibility
export { HealthController } from './health.controller';
