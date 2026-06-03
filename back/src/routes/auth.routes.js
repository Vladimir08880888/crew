import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.post('/register', registerLimiter, asyncHandler(authController.register));
router.post('/login',    loginLimiter,    asyncHandler(authController.login));
router.get('/me', authRequired, asyncHandler(authController.me));
router.post('/change-password', authRequired, asyncHandler(authController.changePassword));
