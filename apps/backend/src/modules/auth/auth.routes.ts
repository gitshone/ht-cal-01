import { Router } from 'express';
import { authController } from './auth.controller';
import { authValidator } from './auth.validator';
import { validateBody } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post(
  '/login/firebase',
  validateBody(authValidator.getFirebaseAuthSchema()),
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
  authController.handleAsync(authController.getCurrentUser.bind(authController))
);

router.post(
  '/logout',
  authenticate,
  authController.handleAsync(authController.logout.bind(authController))
);

export { router as authRoutes };
