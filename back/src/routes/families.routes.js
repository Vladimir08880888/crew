import { Router } from 'express';
import { familiesController } from '../controllers/families.controller.js';
import { authRequired } from '../middleware/auth.js';
import { requireFamilyMember, requireAdmin } from '../middleware/familyAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.use(authRequired);

router.get('/',     asyncHandler(familiesController.list));
router.post('/',    asyncHandler(familiesController.create));
router.post('/join', asyncHandler(familiesController.join));

router.get('/:familyId',
  asyncHandler(requireFamilyMember),
  asyncHandler(familiesController.detail));

router.delete('/:familyId',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.remove));

router.patch('/:familyId',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.rename));

router.post('/:familyId/leave',
  asyncHandler(requireFamilyMember),
  asyncHandler(familiesController.leave));

router.post('/:familyId/regenerate-code',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.regenerateCode));

router.post('/:familyId/approve/:userId',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.approve));

router.patch('/:familyId/members/:userId',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.updateMember));

router.delete('/:familyId/members/:userId',
  asyncHandler(requireFamilyMember),
  asyncHandler(familiesController.removeMember));

router.post('/:familyId/members/:userId/reset-password',
  asyncHandler(requireFamilyMember),
  requireAdmin,
  asyncHandler(familiesController.resetMemberPassword));
