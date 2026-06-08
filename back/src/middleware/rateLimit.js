import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isProd = env.nodeEnv === 'production';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 20 tentatives / 15 min en prod : tolérant aux démos avec plusieurs
  // comptes de test, tout en restant un rempart contre le brute-force.
  max: isProd ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'inscriptions, réessayez plus tard' },
});
