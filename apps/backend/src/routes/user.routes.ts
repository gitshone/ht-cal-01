import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(userController.getUsers.bind(userController)));
router.get(
  '/:id',
  asyncHandler(userController.getUserById.bind(userController))
);

export default router;
