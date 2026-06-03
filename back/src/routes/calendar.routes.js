import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const router = Router();

// Calendrier global (toutes les tâches en cours + à valider pour les parents)
router.get('/:token', asyncHandler(calendarController.export));

// Sub-feed: uniquement les tâches personnelles
router.get('/:token/perso.ics', asyncHandler(calendarController.exportPersonal));

// Sub-feed: tâches d'une famille spécifique
router.get('/:token/family/:familyId.ics', asyncHandler(calendarController.exportFamily));
