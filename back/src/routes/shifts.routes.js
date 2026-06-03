import { Router } from 'express';
import { shiftsController } from '../controllers/shifts.controller.js';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.use(authRequired);

// Routes spécifiques DOIVENT être déclarées AVANT '/:id'
router.get('/upcoming',         asyncHandler(shiftsController.upcoming));
router.get('/summary',          asyncHandler(shiftsController.summary));
router.post('/generate-plan',   asyncHandler(shiftsController.generatePlan));
router.post('/apply-plan',      asyncHandler(shiftsController.applyPlan));
router.post('/clone-week',      asyncHandler(shiftsController.cloneWeek));
router.delete('/clear-week',    asyncHandler(shiftsController.clearWeek));

router.get('/',         asyncHandler(shiftsController.list));
router.post('/',        asyncHandler(shiftsController.create));
router.get('/:id',      asyncHandler(shiftsController.get));
router.put('/:id',      asyncHandler(shiftsController.update));
router.delete('/:id',   asyncHandler(shiftsController.remove));
