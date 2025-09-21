import { Router } from 'express';
import { registerAllProviders, getController, providers } from '../core';

// Import route factories
import { createAuthRoutes } from '../modules/auth/auth.routes';
import { createCalendarRoutes } from '../modules/calendar/calendar.routes';
import { createEventsRoutes } from '../modules/events/events.routes';
import { createQueueRoutes } from '../modules/queue/queue.routes';
import { createHealthRoutes } from '../modules/health/health.routes';
import { createSettingsRoutes } from '../modules/settings/settings.routes';
import { createFileStorageRoutes } from '../modules/file-storage/file-storage.routes';

const router = Router();

// Register all providers
registerAllProviders();

// Create routes using DI container
const authRoutes = createAuthRoutes(getController(providers.AUTH_CONTROLLER));
const calendarRoutes = createCalendarRoutes(
  getController(providers.CALENDAR_CONTROLLER)
);
const eventsRoutes = createEventsRoutes(
  getController(providers.EVENTS_CONTROLLER)
);
const queueRoutes = createQueueRoutes(
  getController(providers.QUEUE_CONTROLLER)
);
const healthRoutes = createHealthRoutes(
  getController(providers.HEALTH_CONTROLLER)
);
const settingsRoutes = createSettingsRoutes(
  getController(providers.SETTINGS_CONTROLLER)
);
const fileStorageRoutes = createFileStorageRoutes(
  getController(providers.FILE_STORAGE_CONTROLLER)
);

// API routes
router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/calendar', calendarRoutes);
router.use('/api/events', eventsRoutes);
router.use('/api/queue', queueRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/files', fileStorageRoutes);

export default router;
