import { LIMITS } from '../config/constants.js';
import { badRequest } from '../utils/httpError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(body) {
  const errors = {};
  const { email, password, first_name, last_name } = body || {};

  if (!email || !EMAIL_RE.test(email) || email.length > LIMITS.EMAIL_MAX) {
    errors.email = 'Email invalide';
  }
  if (!password || password.length < LIMITS.PASSWORD_MIN) {
    errors.password = `Mot de passe d'au moins ${LIMITS.PASSWORD_MIN} caractères`;
  }
  if (!first_name || first_name.length > LIMITS.NAME_MAX) {
    errors.first_name = 'Prénom requis';
  }
  if (!last_name || last_name.length > LIMITS.NAME_MAX) {
    errors.last_name = 'Nom requis';
  }

  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return { email, password, first_name, last_name };
}

export function validateLogin(body) {
  const errors = {};
  const { email, password } = body || {};
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Email invalide';
  if (!password) errors.password = 'Mot de passe requis';
  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return { email, password };
}

export function validateChangePassword(body) {
  const errors = {};
  const { current_password, new_password } = body || {};
  if (!current_password) errors.current_password = 'Mot de passe actuel requis';
  if (!new_password || new_password.length < LIMITS.PASSWORD_MIN) {
    errors.new_password = `Nouveau mot de passe d'au moins ${LIMITS.PASSWORD_MIN} caractères`;
  }
  if (current_password && new_password && current_password === new_password) {
    errors.new_password = 'Le nouveau mot de passe doit être différent';
  }
  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return { current_password, new_password };
}
