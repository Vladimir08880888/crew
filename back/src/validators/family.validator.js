import { FAMILY_ROLES, POSTES, SHIFTS } from '../config/constants.js';
import { badRequest } from '../utils/httpError.js';

export function validateCreateFamily(body) {
  const name = body?.name?.trim();
  if (!name || name.length > 100) throw badRequest('Nom de famille invalide');
  return { name };
}

export function validateJoinFamily(body) {
  const code = body?.invite_code?.trim();
  if (!code) throw badRequest('Code d\'invitation requis');
  return { invite_code: code };
}

export function validateMemberUpdate(body) {
  const errors = {};
  const out = {};
  if (body.role !== undefined) {
    if (!FAMILY_ROLES.includes(body.role)) errors.role = 'Rôle invalide';
    else out.role = body.role;
  }
  if (body.is_admin !== undefined) {
    if (typeof body.is_admin !== 'boolean') errors.is_admin = 'Booléen attendu';
    else out.is_admin = body.is_admin;
  }
  // Extensions « restauration » — toujours optionnelles
  if (body.poste !== undefined) {
    if (body.poste === null || body.poste === '') out.poste = null;
    else if (POSTES.includes(body.poste)) out.poste = body.poste;
    else errors.poste = 'Poste invalide';
  }
  if (body.shift_default !== undefined) {
    if (body.shift_default === null || body.shift_default === '') out.shift_default = null;
    else if (SHIFTS.includes(body.shift_default)) out.shift_default = body.shift_default;
    else errors.shift_default = 'Shift invalide';
  }
  if (body.weekly_hours_target !== undefined) {
    if (body.weekly_hours_target === null || body.weekly_hours_target === '') {
      out.weekly_hours_target = null;
    } else {
      const n = Number(body.weekly_hours_target);
      if (Number.isInteger(n) && n >= 0 && n <= 80) out.weekly_hours_target = n;
      else errors.weekly_hours_target = 'Heures cibles : entier entre 0 et 80';
    }
  }
  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return out;
}
