import { Router } from 'express';
import { FileStorageController } from './file-storage.controller';
import { authenticate } from '../../middleware/auth.middleware';

export function createFileStorageRoutes(
  controller: FileStorageController
): Router {
  const router = Router();

  router.use(authenticate);

  router.post(
    '/upload/logo',
    controller.getUploadMiddleware(),
    controller.handleAsync(controller.uploadLogo.bind(controller))
  );

  router.get(
    '/logo/:key',
    controller.handleAsync(controller.getLogoUrl.bind(controller))
  );

  router.delete(
    '/logo/:key',
    controller.handleAsync(controller.deleteLogo.bind(controller))
  );

  return router;
}
