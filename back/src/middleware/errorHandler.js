import { HttpError } from '../utils/httpError.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Erreur serveur' });
}
