import { teamMemberModel } from '../models/teamMember.model.js';
import { forbidden } from '../utils/httpError.js';

export async function requireTeamMember(req, res, next) {
  try {
    const teamId = Number(req.params.teamId || req.body.team_id);
    if (!teamId) return next(forbidden('team_id manquant'));
    const member = await teamMemberModel.findByTeamAndUser(teamId, req.user.id);
    if (!member || member.status !== 'active') return next(forbidden('Vous n\'êtes pas membre de cette Ã©quipe'));
    req.teamMember = member;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireManager(req, res, next) {
  if (!req.teamMember || req.teamMember.role !== 'manager') {
    return next(forbidden('Réservé aux managers'));
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.teamMember || !req.teamMember.is_admin) {
    return next(forbidden('Réservé aux administrateurs de la Ã©quipe'));
  }
  next();
}
