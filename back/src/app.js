import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { router as apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // CORS : env.frontOrigin peut être une URL unique ou une liste
  // séparée par des virgules (ex: "https://a.com,https://b.com").
  const allowedOrigins = env.frontOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => {
      // Pas d'origin = requête same-origin ou non-browser (curl, server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} non autorisée`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  if (env.nodeEnv !== 'test') app.use(requestLogger);

  app.get('/health', async (req, res) => {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      res.json({ status: 'ok', db: 'ok' });
    } catch (err) {
      res.status(503).json({ status: 'degraded', db: 'unreachable' });
    }
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
