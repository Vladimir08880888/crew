import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.use(authRequired);
router.get('/dashboard', asyncHandler(statsController.dashboard));
router.get('/charts',    asyncHandler(statsController.charts));
