import { familyModel } from '../models/family.model.js';
import { familyMemberModel } from '../models/familyMember.model.js';
import { userModel } from '../models/user.model.js';
import { validateCreateFamily, validateJoinFamily, validateMemberUpdate } from '../validators/family.validator.js';
import { randomInviteCode } from '../utils/randomToken.js';
import { generateTempPassword } from '../services/tempPassword.service.js';
import { hashPassword } from '../services/password.service.js';
import { badRequest, notFound, conflict, forbidden } from '../utils/httpError.js';

export const familiesController = {
  async list(req, res) {
    const families = await familyModel.listForUser(req.user.id);
    res.json(families);
  },

  async create(req, res) {
    const { name } = validateCreateFamily(req.body);
    const invite_code = randomInviteCode();
    const id = await familyModel.create({ name, invite_code, created_by: req.user.id });
    await familyMemberModel.add({
      family_id: id,
      user_id: req.user.id,
      role: 'parent',
      is_admin: true,
      status: 'active',
    });
    res.status(201).json(await familyModel.findById(id));
  },

  async detail(req, res) {
    const id = Number(req.params.familyId);
    const family = await familyModel.findById(id);
    if (!family) throw notFound('Famille introuvable');
    const members = await familyMemberModel.listByFamily(id);
    res.json({ ...family, members });
  },

  async join(req, res) {
    const { invite_code } = validateJoinFamily(req.body);
    const family = await familyModel.findByInviteCode(invite_code);
    if (!family) throw notFound('Code invalide');
    const existing = await familyMemberModel.findByFamilyAndUser(family.id, req.user.id);
    if (existing) throw conflict('Vous appartenez déjà à cette famille (ou demande en attente)');
    await familyMemberModel.add({
      family_id: family.id,
      user_id: req.user.id,
      role: 'child',
      is_admin: false,
      status: 'pending',
    });
    res.status(201).json({ message: 'Demande envoyée, en attente de validation par un parent', family_id: family.id });
  },

  async approve(req, res) {
    const familyId = Number(req.params.familyId);
    const userId = Number(req.params.userId);
    const { role } = req.body;
    if (!['parent', 'child'].includes(role)) throw badRequest('Rôle requis (parent|child)');
    const member = await familyMemberModel.findByFamilyAndUser(familyId, userId);
    if (!member) throw notFound('Membre introuvable');
    await familyMemberModel.update(familyId, userId, { status: 'active', role });
    res.json({ message: 'Membre validé' });
  },

  async updateMember(req, res) {
    const familyId = Number(req.params.familyId);
    const userId = Number(req.params.userId);
    const fields = validateMemberUpdate(req.body);
    await familyMemberModel.update(familyId, userId, fields);
    res.json({ message: 'Membre mis à jour' });
  },

  async removeMember(req, res) {
    const familyId = Number(req.params.familyId);
    const userId = Number(req.params.userId);
    const isSelf = userId === req.user.id;
    if (!isSelf && !req.familyMember.is_admin) {
      throw forbidden('Seul un administrateur peut retirer un autre membre');
    }
    const target = await familyMemberModel.findByFamilyAndUser(familyId, userId);
    if (!target) throw notFound('Membre introuvable');
    if (target.is_admin) {
      const admins = await familyMemberModel.countAdmins(familyId);
      if (admins <= 1) throw badRequest('Impossible de retirer le dernier administrateur');
    }
    await familyMemberModel.remove(familyId, userId);
    res.json({ message: 'Membre retiré' });
  },

  async regenerateCode(req, res) {
    const familyId = Number(req.params.familyId);
    const code = randomInviteCode();
    await familyModel.regenerateCode(familyId, code);
    res.json({ invite_code: code });
  },

  async rename(req, res) {
    const { name } = validateCreateFamily(req.body);
    const familyId = Number(req.params.familyId);
    await familyModel.rename(familyId, name);
    res.json(await familyModel.findById(familyId));
  },

  async leave(req, res) {
    const familyId = Number(req.params.familyId);
    const member = await familyMemberModel.findByFamilyAndUser(familyId, req.user.id);
    if (!member) throw notFound('Pas membre de cette famille');
    if (member.is_admin) {
      const admins = await familyMemberModel.countAdmins(familyId);
      if (admins <= 1) throw badRequest('Vous êtes le dernier administrateur — désignez un autre admin avant de quitter');
    }
    await familyMemberModel.remove(familyId, req.user.id);
    res.json({ message: 'Vous avez quitté la famille' });
  },

  async remove(req, res) {
    const familyId = Number(req.params.familyId);
    await familyModel.remove(familyId);
    res.json({ message: 'Famille supprimée' });
  },

  async resetMemberPassword(req, res) {
    const familyId = Number(req.params.familyId);
    const targetUserId = Number(req.params.userId);

    if (targetUserId === req.user.id) {
      throw badRequest('Utilisez la page Profil pour changer votre propre mot de passe');
    }

    const target = await familyMemberModel.findByFamilyAndUser(familyId, targetUserId);
    if (!target || target.status !== 'active') {
      throw notFound('Ce membre n\'est pas dans la famille');
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
};
