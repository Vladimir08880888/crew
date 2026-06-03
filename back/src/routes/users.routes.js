import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.use(authRequired);
router.patch('/me', asyncHandler(usersController.updateProfile));
