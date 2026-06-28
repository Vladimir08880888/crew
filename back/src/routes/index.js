import { Router } from 'express';
import { router as authRouter } from './auth.routes.js';
import { router as usersRouter } from './users.routes.js';
import { router as teamsRouter } from './teams.routes.js';
import { router as shiftsRouter } from './shifts.routes.js';
import { router as statsRouter } from './stats.routes.js';
import { router as calendarRouter } from './calendar.routes.js';

export const router = Router();

router.use('/auth',     authRouter);
router.use('/users',    usersRouter);
router.use('/teams', teamsRouter);
router.use('/shifts',   shiftsRouter);
router.use('/stats',    statsRouter);
router.use('/calendar', calendarRouter);
