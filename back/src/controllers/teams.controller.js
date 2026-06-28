import { teamModel } from '../models/team.model.js';
import { teamMemberModel } from '../models/teamMember.model.js';
import { userModel } from '../models/user.model.js';
import { validateCreateTeam, validateJoinTeam, validateMemberUpdate, validateTeamSettings } from '../validators/team.validator.js';
import { randomInviteCode } from '../utils/randomToken.js';
import { generateTempPassword } from '../services/tempPassword.service.js';
import { hashPassword } from '../services/password.service.js';
import { badRequest, notFound, conflict, forbidden } from '../utils/httpError.js';

export const teamsController = {
  async list(req, res) {
    const teams = await teamModel.listForUser(req.user.id);
    res.json(teams);
  },

  async create(req, res) {
    const { name } = validateCreateTeam(req.body);
    const invite_code = randomInviteCode();
    const id = await teamModel.create({ name, invite_code, created_by: req.user.id });
    await teamMemberModel.add({
      team_id: id,
      user_id: req.user.id,
      role: 'manager',
      is_admin: true,
      status: 'active',
    });
    res.status(201).json(await teamModel.findById(id));
  },

  async detail(req, res) {
    const id = Number(req.params.teamId);
    const team = await teamModel.findById(id);
    if (!team) throw notFound('Équipe introuvable');
    const members = await teamMemberModel.listByTeam(id);
    res.json({ ...team, members });
  },

  async join(req, res) {
    const { invite_code } = validateJoinTeam(req.body);
    const team = await teamModel.findByInviteCode(invite_code);
    if (!team) throw notFound('Code invalide');
    const existing = await teamMemberModel.findByTeamAndUser(team.id, req.user.id);
    if (existing) throw conflict('Vous appartenez déjà à cette équipe (ou demande en attente)');
    await teamMemberModel.add({
      team_id: team.id,
      user_id: req.user.id,
      role: 'equipier',
      is_admin: false,
      status: 'pending',
    });
    res.status(201).json({ message: 'Demande envoyée, en attente de validation par le manager', team_id: team.id });
  },

  async approve(req, res) {
    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);
    const { role } = req.body;
    if (!['manager', 'equipier'].includes(role)) throw badRequest('Rôle requis (manager|equipier)');
    const member = await teamMemberModel.findByTeamAndUser(teamId, userId);
    if (!member) throw notFound('Membre introuvable');
    await teamMemberModel.update(teamId, userId, { status: 'active', role });
    res.json({ message: 'Membre validé' });
  },

  async updateMember(req, res) {
    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);
    const fields = validateMemberUpdate(req.body);
    await teamMemberModel.update(teamId, userId, fields);
    res.json({ message: 'Membre mis à jour' });
  },

  async removeMember(req, res) {
    const teamId = Number(req.params.teamId);
    const userId = Number(req.params.userId);
    const isSelf = userId === req.user.id;
    if (!isSelf && !req.teamMember.is_admin) {
      throw forbidden('Seul un administrateur peut retirer un autre membre');
    }
    const target = await teamMemberModel.findByTeamAndUser(teamId, userId);
    if (!target) throw notFound('Membre introuvable');
    if (target.is_admin) {
      const admins = await teamMemberModel.countAdmins(teamId);
      if (admins <= 1) throw badRequest('Impossible de retirer le dernier administrateur');
    }
    await teamMemberModel.remove(teamId, userId);
    res.json({ message: 'Membre retiré' });
  },

  async regenerateCode(req, res) {
    const teamId = Number(req.params.teamId);
    const code = randomInviteCode();
    await teamModel.regenerateCode(teamId, code);
    res.json({ invite_code: code });
  },

  async rename(req, res) {
    const { name } = validateCreateTeam(req.body);
    const teamId = Number(req.params.teamId);
    await teamModel.rename(teamId, name);
    res.json(await teamModel.findById(teamId));
  },

  async leave(req, res) {
    const teamId = Number(req.params.teamId);
    const member = await teamMemberModel.findByTeamAndUser(teamId, req.user.id);
    if (!member) throw notFound('Pas membre de cette équipe');
    if (member.is_admin) {
      const admins = await teamMemberModel.countAdmins(teamId);
      if (admins <= 1) throw badRequest('Vous êtes le dernier administrateur — désignez un autre admin avant de quitter');
    }
    await teamMemberModel.remove(teamId, req.user.id);
    res.json({ message: 'Vous avez quitté l\'équipe' });
  },

  async remove(req, res) {
    const teamId = Number(req.params.teamId);
    await teamModel.remove(teamId);
    res.json({ message: 'Équipe supprimée' });
  },

  async resetMemberPassword(req, res) {
    const teamId = Number(req.params.teamId);
    const targetUserId = Number(req.params.userId);

    if (targetUserId === req.user.id) {
      throw badRequest('Utilisez la page Profil pour changer votre propre mot de passe');
    }

    const target = await teamMemberModel.findByTeamAndUser(teamId, targetUserId);
    if (!target || target.status !== 'active') {
      throw notFound('Ce membre n\'est pas dans l\'équipe');
    }

    const tempPassword = generateTempPassword(10);
    const hash = await hashPassword(tempPassword);
    await userModel.updatePassword(targetUserId, hash);

    res.json({
      message: 'Mot de passe réinitialisé',
      temp_password: tempPassword,
      warning: 'Communiquez ce mot de passe au membre concerné — il ne sera plus affiché.',
    });
  },

  async getSettings(req, res) {
    const teamId = Number(req.params.teamId);
    const settings = await teamModel.getSettings(teamId);
    if (!settings) throw notFound('Équipe introuvable');
    res.json(settings);
  },

  async updateSettings(req, res) {
    const teamId = Number(req.params.teamId);
    const fields = validateTeamSettings(req.body);
    await teamModel.updateSettings(teamId, fields);
    res.json(await teamModel.getSettings(teamId));
  },
};
