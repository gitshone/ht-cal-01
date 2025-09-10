import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/login/firebase',
  asyncHandler(authController.loginWithFirebase.bind(authController))
);
router.post(
  '/refresh',
  asyncHandler(authController.refreshToken.bind(authController))
);

// Protected routes
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser.bind(authController))
);
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout.bind(authController))
);

export default router;
