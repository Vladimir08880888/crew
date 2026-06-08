import { FAMILY_ROLES, POSTES, SHIFTS, LEVELS } from '../config/constants.js';
import { badRequest } from '../utils/httpError.js';

export function validateCreateFamily(body) {
  const name = body?.name?.trim();
  if (!name || name.length > 100) throw badRequest('Nom d\'équipe invalide');
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
  if (body.level !== undefined) {
    if (!LEVELS.includes(body.level)) errors.level = 'Niveau invalide';
    else out.level = body.level;
  }
  if (body.coef_override !== undefined) {
    if (body.coef_override === null || body.coef_override === '') out.coef_override = null;
    else {
      const n = Number(body.coef_override);
      if (Number.isInteger(n) && n >= 0 && n <= 500) out.coef_override = n;
      else errors.coef_override = 'Coefficient personnel : entier entre 0 et 500 (vide pour utiliser le niveau)';
    }
  }
  if (body.skills_mask !== undefined) {
    if (body.skills_mask === null || body.skills_mask === '') out.skills_mask = null;
    else {
      const n = Number(body.skills_mask);
      if (Number.isInteger(n) && n >= 0 && n <= 31) out.skills_mask = n;
      else errors.skills_mask = 'Polyvalence : entier entre 0 et 31 (bitmask postes)';
    }
  }
  if (body.rate_override !== undefined) {
    if (body.rate_override === null || body.rate_override === '') out.rate_override = null;
    else {
      const n = Number(body.rate_override);
      // En centimes : 0..10000 (jusqu'à 100 €/h) — bornes larges.
      if (Number.isInteger(n) && n >= 0 && n <= 10000) out.rate_override = n;
      else errors.rate_override = 'Taux personnel : entier 0..10000 (centimes/h)';
    }
  }
  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return out;
}

const SETTING_FIELDS = [
  'junior_coef', 'confirme_coef', 'chef_coef', 'max_couverts',
  'midi_cuisine_ideal', 'midi_salle_ideal',
  'soir_cuisine_ideal', 'soir_salle_ideal',
  'closed_days_mask',
  'junior_rate', 'confirme_rate', 'chef_rate',
];

export function validateFamilySettings(body) {
  const errors = {};
  const out = {};
  for (const f of SETTING_FIELDS) {
    if (body[f] === undefined) continue;
    const n = Number(body[f]);
    if (!Number.isInteger(n) || n < 0 || n > 10000) errors[f] = 'Entier 0–10000 attendu';
    else out[f] = n;
  }
  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return out;
}
