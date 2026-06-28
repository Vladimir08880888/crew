import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

// Calendrier global (toutes les tâches en cours + à valider pour les managers)
router.get('/:token', asyncHandler(calendarController.export));

// Alias .ics pour clients qui exigent l'extension (Apple Calendar, etc.)
router.get('/:token/perso.ics', asyncHandler(calendarController.export));

// Sub-feed: tâches d'une Ã©quipe spécifique
router.get('/:token/team/:teamId.ics', asyncHandler(calendarController.exportTeam));
