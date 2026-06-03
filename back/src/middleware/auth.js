import { verifyToken } from '../services/jwt.service.js';
import { unauthorized } from '../utils/httpError.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized());
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub };
    next();
  } catch {
    next(unauthorized('Token invalide ou expiré'));
  }
}
