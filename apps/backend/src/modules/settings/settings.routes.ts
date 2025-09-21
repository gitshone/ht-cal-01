import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { SettingsValidator } from './settings.validator';
import { authenticate } from '../../middleware/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middleware/validation.middleware';

export const createSettingsRoutes = (
  settingsController: SettingsController
): Router => {
  const router = Router();
  const validator = new SettingsValidator();

  // Apply authentication middleware to all routes
  router.use(authenticate);

  // User Settings routes
  router.get(
    '/',
    settingsController.handleAsync(
      settingsController.getUserSettings.bind(settingsController)
    )
  );

  router.put(
    '/',
    validateBody(validator.getUpdateUserSettingsSchema()),
    settingsController.handleAsync(
      settingsController.updateUserSettings.bind(settingsController)
    )
  );

  router.delete(
    '/',
    settingsController.handleAsync(
      settingsController.deleteUserSettings.bind(settingsController)
    )
  );

  // Unavailability Blocks routes
  router.get(
    '/unavailability-blocks',
    settingsController.handleAsync(
      settingsController.getUserUnavailabilityBlocks.bind(settingsController)
    )
  );

  router.post(
    '/unavailability-blocks',
    validateBody(validator.getCreateUnavailabilityBlockSchema()),
    settingsController.handleAsync(
      settingsController.createUnavailabilityBlock.bind(settingsController)
    )
  );

  router.put(
    '/unavailability-blocks/:id',
    validateParams(validator.getUnavailabilityBlockIdSchema()),
    validateBody(validator.getUpdateUnavailabilityBlockSchema()),
    settingsController.handleAsync(
      settingsController.updateUnavailabilityBlock.bind(settingsController)
    )
  );

  router.delete(
    '/unavailability-blocks/:id',
    validateParams(validator.getUnavailabilityBlockIdSchema()),
    settingsController.handleAsync(
      settingsController.deleteUnavailabilityBlock.bind(settingsController)
    )
  );

  // Logo upload routes
  router.post(
    '/logo',
    settingsController.getUploadMiddleware(),
    settingsController.handleAsync(
      settingsController.uploadLogo.bind(settingsController)
    )
  );

  router.delete(
    '/logo',
    settingsController.handleAsync(
      settingsController.deleteLogo.bind(settingsController)
    )
  );

  return router;
};
