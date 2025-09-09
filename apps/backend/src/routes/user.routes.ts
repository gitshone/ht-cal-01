import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.get('/', userController.getUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));

export default router;
