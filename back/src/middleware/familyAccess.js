import { familyMemberModel } from '../models/familyMember.model.js';
import { forbidden } from '../utils/httpError.js';

export async function requireFamilyMember(req, res, next) {
  try {
    const familyId = Number(req.params.familyId || req.body.family_id);
    if (!familyId) return next(forbidden('family_id manquant'));
    const member = await familyMemberModel.findByFamilyAndUser(familyId, req.user.id);
    if (!member || member.status !== 'active') return next(forbidden('Vous n\'êtes pas membre de cette famille'));
    req.familyMember = member;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireParent(req, res, next) {
  if (!req.familyMember || req.familyMember.role !== 'manager') {
    return next(forbidden('Réservé aux managers'));
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.familyMember || !req.familyMember.is_admin) {
    return next(forbidden('Réservé aux administrateurs de la famille'));
  }
  next();
}
