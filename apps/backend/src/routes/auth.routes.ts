import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/login/firebase',
  authController.loginWithFirebase.bind(authController)
);
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser.bind(authController)
);
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

export default router;
