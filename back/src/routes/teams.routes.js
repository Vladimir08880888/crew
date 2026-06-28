import { Router } from 'express';
import { teamsController } from '../controllers/teams.controller.js';
import { authRequired } from '../middleware/auth.js';
import { requireTeamMember, requireAdmin, requireManager } from '../middleware/teamAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

router.use(authRequired);

router.get('/',     asyncHandler(teamsController.list));
router.post('/',    asyncHandler(teamsController.create));
router.post('/join', asyncHandler(teamsController.join));

router.get('/:teamId',
  asyncHandler(requireTeamMember),
  asyncHandler(teamsController.detail));

router.delete('/:teamId',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.remove));

router.patch('/:teamId',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.rename));

router.post('/:teamId/leave',
  asyncHandler(requireTeamMember),
  asyncHandler(teamsController.leave));

router.post('/:teamId/regenerate-code',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.regenerateCode));

router.post('/:teamId/approve/:userId',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.approve));

router.patch('/:teamId/members/:userId',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.updateMember));

router.delete('/:teamId/members/:userId',
  asyncHandler(requireTeamMember),
  asyncHandler(teamsController.removeMember));

router.post('/:teamId/members/:userId/reset-password',
  asyncHandler(requireTeamMember),
  requireAdmin,
  asyncHandler(teamsController.resetMemberPassword));

router.get('/:teamId/settings',
  asyncHandler(requireTeamMember),
  asyncHandler(teamsController.getSettings));

// Settings : modifiable par tout manager (rôle 'manager'), pas
// seulement l'admin. Permet à Sophie/Ahmed (managers non-admin)
// d'ajuster jours d'ouverture, idéaux poste et taux horaires.
router.put('/:teamId/settings',
  asyncHandler(requireTeamMember),
  requireManager,
  asyncHandler(teamsController.updateSettings));
