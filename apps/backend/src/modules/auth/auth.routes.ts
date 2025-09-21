import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthValidator } from './auth.validator';
import { validateBody } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();
  const validator = new AuthValidator();

  router.post(
    '/login/firebase',
    validateBody(validator.getFirebaseAuthSchema()),
    authController.handleAsync(
      authController.loginWithFirebase.bind(authController)
    )
  );

  router.post(
    '/refresh',
    authController.handleAsync(authController.refreshToken.bind(authController))
  );

  router.get(
    '/me',
    authenticate,
    authController.handleAsync(
      authController.getCurrentUser.bind(authController)
    )
  );

  router.post(
    '/logout',
    authenticate,
    authController.handleAsync(authController.logout.bind(authController))
  );

  router.put(
    '/handle',
    authenticate,
    validateBody(validator.getUpdateHandleSchema()),
    authController.handleAsync(authController.updateHandle.bind(authController))
  );

  return router;
};
