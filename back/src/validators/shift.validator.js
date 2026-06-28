import { POSTES, SHIFTS } from '../config/constants.js';
import { badRequest } from '../utils/httpError.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}(?::\d{2})?$/;

function validateCommon(body, { partial = false } = {}) {
  const errors = {};
  const out = {};

  if (!partial || body.team_id !== undefined) {
    if (!body.team_id || Number.isNaN(Number(body.team_id))) {
      errors.team_id = "Identifiant d'équipe requis";
    } else {
      out.team_id = Number(body.team_id);
    }
  }

  if (!partial || body.user_id !== undefined) {
    if (!body.user_id || Number.isNaN(Number(body.user_id))) {
      errors.user_id = "Membre requis";
    } else {
      out.user_id = Number(body.user_id);
    }
  }

  if (!partial || body.date !== undefined) {
    if (!body.date || !ISO_DATE.test(body.date)) errors.date = "Date invalide (YYYY-MM-DD)";
    else out.date = body.date;
  }

  if (!partial || body.shift_type !== undefined) {
    if (!SHIFTS.includes(body.shift_type)) errors.shift_type = "Type de shift invalide";
    else out.shift_type = body.shift_type;
  }

  if (!partial || body.poste !== undefined) {
    if (!POSTES.includes(body.poste)) errors.poste = "Poste invalide";
    else out.poste = body.poste;
  }

  if (body.start_time !== undefined) {
    if (body.start_time === null || body.start_time === '') out.start_time = null;
    else if (TIME.test(body.start_time)) out.start_time = body.start_time;
    else errors.start_time = "Heure début invalide (HH:MM)";
  }

  if (body.end_time !== undefined) {
    if (body.end_time === null || body.end_time === '') out.end_time = null;
    else if (TIME.test(body.end_time)) out.end_time = body.end_time;
    else errors.end_time = "Heure fin invalide (HH:MM)";
  }

  if (body.note !== undefined) {
    out.note = body.note ? String(body.note).trim().slice(0, 500) : null;
  }

  if (Object.keys(errors).length) throw badRequest('Champs invalides', errors);
  return out;
}

export function validateCreateShift(body) {
  return validateCommon(body, { partial: false });
}

export function validateUpdateShift(body) {
  return validateCommon(body, { partial: true });
}
