import { shiftModel } from '../models/shift.model.js';
import { familyMemberModel } from '../models/familyMember.model.js';
import { familyModel } from '../models/family.model.js';
import { validateCreateShift, validateUpdateShift } from '../validators/shift.validator.js';
import { forbidden, notFound, badRequest } from '../utils/httpError.js';
import { generatePlan, computeSummary } from '../services/plannerSolver.js';
import { pool } from '../db/pool.js';

/**
 * Vérifie que l'utilisateur est manager (parent) de la famille donnée.
 * Un équipier (child) ne peut pas créer/modifier/supprimer un shift.
 */
async function assertCanManageShifts(familyId, userId) {
  const member = await familyMemberModel.findByFamilyAndUser(familyId, userId);
  if (!member || member.status !== 'active') {
    throw forbidden('Pas membre de cette équipe');
  }
  if (member.role !== 'parent') {
    throw forbidden('Seuls les managers peuvent gérer le planning');
  }
  return member;
}

/**
 * Vérifie que l'utilisateur appartient à la famille (lecture autorisée
 * pour tout membre actif — les équipiers doivent voir le planning).
 */
async function assertCanReadShifts(familyId, userId) {
  const member = await familyMemberModel.findByFamilyAndUser(familyId, userId);
  if (!member || member.status !== 'active') {
    throw forbidden('Pas membre de cette équipe');
  }
  return member;
}

export const shiftsController = {
  /**
   * GET /api/shifts?family_id=X&from=Y&to=Z&user_id=W
   * Liste des shifts d'une famille sur une période donnée.
   * - Manager : voit tous les shifts de la famille
   * - Équipier : ne voit que ses propres shifts (filtre forcé)
   */
  async list(req, res) {
    const familyId = Number(req.query.family_id);
    if (!familyId) throw badRequest("Paramètre family_id requis");

    const member = await assertCanReadShifts(familyId, req.user.id);

    const today = new Date().toISOString().slice(0, 10);
    const defaultTo = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

    let userId = req.query.user_id ? Number(req.query.user_id) : null;
    // Équipier : forcer à ses propres shifts
    if (member.role === 'child') userId = req.user.id;

    const shifts = await shiftModel.listByFamily({
      familyId,
      from: req.query.from || today,
      to:   req.query.to   || defaultTo,
      userId,
    });
    res.json(shifts);
  },

  /**
   * GET /api/shifts/upcoming
   * Prochains shifts de l'utilisateur (toutes familles confondues).
   * Utilisé par le widget dashboard et l'export iCal.
   */
  async upcoming(req, res) {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const shifts = await shiftModel.listUpcomingForUser(req.user.id, limit);
    res.json(shifts);
  },

  /**
   * POST /api/shifts
   * Crée un shift. Manager only.
   */
  async create(req, res) {
    const data = validateCreateShift(req.body);
    await assertCanManageShifts(data.family_id, req.user.id);

    // Vérifier que l'user_id appartient bien à la famille
    const target = await familyMemberModel.findByFamilyAndUser(data.family_id, data.user_id);
    if (!target || target.status !== 'active') {
      throw badRequest("Cet équipier n'est pas dans l'équipe");
    }

    try {
      const id = await shiftModel.create({ ...data, created_by: req.user.id });
      res.status(201).json(await shiftModel.findById(id));
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw badRequest("Ce shift existe déjà pour cet équipier");
      }
      throw err;
    }
  },

  /**
   * GET /api/shifts/:id
   */
  async get(req, res) {
    const shift = await shiftModel.findById(Number(req.params.id));
    if (!shift) throw notFound('Shift introuvable');
    await assertCanReadShifts(shift.family_id, req.user.id);
    res.json(shift);
  },

  /**
   * PUT /api/shifts/:id — manager only
   */
  async update(req, res) {
    const shift = await shiftModel.findById(Number(req.params.id));
    if (!shift) throw notFound('Shift introuvable');
    await assertCanManageShifts(shift.family_id, req.user.id);
    const fields = validateUpdateShift(req.body);
    await shiftModel.update(shift.id, fields);
    res.json(await shiftModel.findById(shift.id));
  },

  /**
   * DELETE /api/shifts/:id — manager only
   */
  async remove(req, res) {
    const shift = await shiftModel.findById(Number(req.params.id));
    if (!shift) throw notFound('Shift introuvable');
    await assertCanManageShifts(shift.family_id, req.user.id);
    await shiftModel.remove(shift.id);
    res.json({ message: 'Shift supprimé' });
  },

  // ─────────────────────────────────────────────────────────────────
  // Smart planning endpoints (Gold)
  // ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/shifts/summary?family_id=X&from=Y&to=Z
   * Retourne les heures par membre + couverture (gaps).
   * Tout membre actif peut lire.
   */
  async summary(req, res) {
    const familyId = Number(req.query.family_id);
    if (!familyId) throw badRequest('family_id requis');
    await assertCanReadShifts(familyId, req.user.id);

    const from = req.query.from;
    const to   = req.query.to;
    if (!from || !to) throw badRequest('from et to requis (YYYY-MM-DD)');

    const [members, shifts] = await Promise.all([
      familyMemberModel.listByFamily(familyId),
      shiftModel.listByFamily({ familyId, from, to }),
    ]);

    const weekDates = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      weekDates.push(d.toISOString().slice(0, 10));
    }

    const activeMembers = members.filter((m) => m.status === 'active');
    const settings = await familyModel.getSettings(familyId);
    const { memberStats, coverage } = computeSummary({
      members: activeMembers,
      weekDates,
      existingShifts: shifts,
      settings,
    });

    // Rétro-compat : coverageGaps est dérivé de coverage (slots sous le seuil min).
    const coverageGaps = coverage
      .filter((c) => c.actual_coef < c.ideal / 2)
      .map((c) => ({ date: c.date, shift_type: c.service, poste: c.poste, missing: 1 }));

    res.json({ memberStats, coverage, coverageGaps, totalShifts: shifts.length });
  },

  /**
   * POST /api/shifts/generate-plan
   *   body: { family_id, from, to }
   * Manager only — propose des shifts (sans les créer).
   * Retourne { suggested, uncovered, hours }.
   */
  async generatePlan(req, res) {
    const familyId = Number(req.body.family_id);
    const from = req.body.from;
    const to   = req.body.to;
    if (!familyId || !from || !to) throw badRequest('family_id, from, to requis');

    await assertCanManageShifts(familyId, req.user.id);

    const [members, existingShifts] = await Promise.all([
      familyMemberModel.listByFamily(familyId),
      shiftModel.listByFamily({ familyId, from, to }),
    ]);

    const weekDates = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      weekDates.push(d.toISOString().slice(0, 10));
    }

    const activeMembers = members.filter((m) => m.status === 'active');
    const settings = await familyModel.getSettings(familyId);
    const capacityByDate = req.body.capacityByDate && typeof req.body.capacityByDate === 'object'
      ? req.body.capacityByDate
      : {};
    const result = generatePlan({
      members: activeMembers,
      weekDates,
      existingShifts: existingShifts.map((s) => ({
        ...s,
        date: s.date.toISOString ? s.date.toISOString().slice(0, 10) : s.date,
        family_id: familyId,
      })),
      settings,
      capacityByDate,
    });

    res.json(result);
  },

  /**
   * POST /api/shifts/apply-plan
   *   body: { family_id, shifts: [...] }
   * Crée en masse les shifts proposés (issus de generate-plan).
   * Manager only. Ignore les doublons silencieusement.
   */
  async applyPlan(req, res) {
    const familyId = Number(req.body.family_id);
    const shifts = Array.isArray(req.body.shifts) ? req.body.shifts : [];
    if (!familyId) throw badRequest('family_id requis');
    if (shifts.length === 0) throw badRequest('Aucun shift à créer');

    await assertCanManageShifts(familyId, req.user.id);

    let created = 0;
    let skipped = 0;
    for (const s of shifts) {
      try {
        await shiftModel.create({
          family_id: familyId,
          user_id: Number(s.user_id),
          date: s.date,
          shift_type: s.shift_type,
          poste: s.poste,
          start_time: s.start_time || null,
          end_time: s.end_time || null,
          note: s.note || null,
          created_by: req.user.id,
        });
        created++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') skipped++;
        else throw err;
      }
    }
    res.json({ created, skipped, total: shifts.length });
  },

  /**
   * POST /api/shifts/clone-week
   *   body: { family_id, source_from, source_to, target_from }
   * Duplique tous les shifts d'une semaine vers une autre.
   * Manager only.
   */
  async cloneWeek(req, res) {
    const familyId = Number(req.body.family_id);
    const { source_from, source_to, target_from } = req.body;
    if (!familyId || !source_from || !source_to || !target_from) {
      throw badRequest('family_id, source_from, source_to, target_from requis');
    }
    await assertCanManageShifts(familyId, req.user.id);

    const sourceShifts = await shiftModel.listByFamily({
      familyId, from: source_from, to: source_to,
    });
    const diffDays = Math.round(
      (new Date(target_from) - new Date(source_from)) / 86400000,
    );

    let created = 0;
    let skipped = 0;
    for (const s of sourceShifts) {
      const sourceDate = s.date.toISOString
        ? s.date.toISOString().slice(0, 10)
        : s.date.slice(0, 10);
      const d = new Date(sourceDate);
      d.setDate(d.getDate() + diffDays);
      const targetDate = d.toISOString().slice(0, 10);
      try {
        await shiftModel.create({
          family_id: familyId,
          user_id: s.user_id,
          date: targetDate,
          shift_type: s.shift_type,
          poste: s.poste,
          start_time: s.start_time,
          end_time: s.end_time,
          note: s.note,
          created_by: req.user.id,
        });
        created++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') skipped++;
        else throw err;
      }
    }
    res.json({ created, skipped, total: sourceShifts.length });
  },

  /**
   * DELETE /api/shifts/clear-week?family_id=X&from=Y&to=Z
   * Supprime tous les shifts d'une plage de dates pour une famille.
   * Manager only.
   */
  async clearWeek(req, res) {
    const familyId = Number(req.query.family_id);
    const { from, to } = req.query;
    if (!familyId || !from || !to) throw badRequest('family_id, from, to requis');
    await assertCanManageShifts(familyId, req.user.id);
    const [r] = await pool.query(
      'DELETE FROM shifts WHERE family_id = ? AND date BETWEEN ? AND ?',
      [familyId, from, to],
    );
    res.json({ deleted: r.affectedRows });
  },
};
