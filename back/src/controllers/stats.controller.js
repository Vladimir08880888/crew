/**
 * Stats controller — version Crew (focus shifts uniquement).
 *
 *   dashboard : pour l'écran d'accueil
 *     - upcoming shifts de l'utilisateur (5 prochains)
 *     - récap heures de la semaine en cours par membre actif des
 *       équipes de l'utilisateur
 *
 *   charts : pour l'écran statistiques d'une équipe
 *     - shifts par poste (90 derniers jours)
 *     - shifts par membre (30 derniers jours)
 *     - timeline shifts par jour (30 derniers jours)
 */
import { teamModel } from '../models/team.model.js';
import { teamMemberModel } from '../models/teamMember.model.js';
import { shiftModel } from '../models/shift.model.js';
import { pool } from '../db/pool.js';
import { badRequest, forbidden } from '../utils/httpError.js';
import { SHIFT_DURATIONS } from '../config/constants.js';

function mondayOf(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function iso(d) { return d.toISOString().slice(0, 10); }

async function memberBreakdownByHours(teamId, from, to) {
  const [members] = await pool.query(
    `SELECT u.id AS user_id, u.first_name, u.last_name,
            fm.role, fm.is_admin, fm.poste, fm.weekly_hours_target
     FROM team_members fm
     JOIN users u ON u.id = fm.user_id
     WHERE fm.team_id = ? AND fm.status = 'active'
     ORDER BY fm.is_admin DESC, fm.role, u.first_name`,
    [teamId]
  );

  const shifts = await shiftModel.listByTeam({ teamId, from, to });
  const hoursByUser = {};
  for (const s of shifts) {
    hoursByUser[s.user_id] = (hoursByUser[s.user_id] || 0) + (SHIFT_DURATIONS[s.shift_type] || 0);
  }

  return members.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    role: m.role,
    is_admin: !!m.is_admin,
    poste: m.poste,
    weekly_hours_target: m.weekly_hours_target,
    hours_planned: hoursByUser[m.user_id] || 0,
  }));
}

async function chartsForTeam(teamId) {
  // Shifts par poste, 90 derniers jours
  const [byPoste] = await pool.query(
    `SELECT poste, COUNT(*) AS n
     FROM shifts
     WHERE team_id = ?
       AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
     GROUP BY poste
     ORDER BY n DESC`,
    [teamId]
  );

  // Shifts par membre, 30 derniers jours
  const [byMember] = await pool.query(
    `SELECT u.id, u.first_name,
            COUNT(s.id) AS shifts_count
     FROM team_members fm
     JOIN users u ON u.id = fm.user_id
     LEFT JOIN shifts s ON s.user_id = u.id AND s.team_id = fm.team_id
                       AND s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     WHERE fm.team_id = ? AND fm.status = 'active'
     GROUP BY u.id, u.first_name
     ORDER BY u.first_name`,
    [teamId]
  );

  // Timeline shifts par jour, 30 derniers jours
  const [timeline] = await pool.query(
    `SELECT DATE(date) AS day, COUNT(*) AS n
     FROM shifts
     WHERE team_id = ?
       AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       AND date <= CURDATE()
     GROUP BY DATE(date)
     ORDER BY day`,
    [teamId]
  );

  const timelineMap = new Map(timeline.map((r) => [String(r.day instanceof Date ? r.day.toISOString().slice(0, 10) : r.day), Number(r.n)]));
  const fullTimeline = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    fullTimeline.push({ day: key, n: timelineMap.get(key) || 0 });
  }

  return {
    byPoste: byPoste.map((r) => ({ poste: r.poste, n: Number(r.n) })),
    byMember: byMember.map((r) => ({
      first_name: r.first_name,
      shifts_count: Number(r.shifts_count),
    })),
    timeline: fullTimeline,
  };
}

export const statsController = {
  /**
   * GET /api/stats/charts?team_id=X
   * Réservé aux managers (manager role).
   */
  async charts(req, res) {
    const teamId = Number(req.query.team_id);
    if (!teamId) throw badRequest('team_id requis');
    const member = await teamMemberModel.findByTeamAndUser(teamId, req.user.id);
    if (!member || member.status !== 'active') throw forbidden('Pas membre de cette équipe');
    if (member.role !== 'manager') throw forbidden('Statistiques réservées aux managers');
    res.json(await chartsForTeam(teamId));
  },

  /**
   * GET /api/stats/dashboard
   * Tableau de bord d'accueil — shifts à venir + équipes.
   */
  async dashboard(req, res) {
    const userId = req.user.id;

    // Prochains shifts de l'utilisateur
    const upcoming = await shiftModel.listUpcomingForUser(userId, 5);

    // Équipes de l'utilisateur
    const teams = await teamModel.listForUser(userId);
    const monday = mondayOf();
    const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);

    const teamsEnriched = [];
    for (const f of teams.filter((x) => x.status === 'active')) {
      const members = await teamMemberModel.listByTeam(f.id);
      const breakdown = f.role === 'manager'
        ? await memberBreakdownByHours(f.id, iso(monday), iso(sunday))
        : null;
      teamsEnriched.push({ ...f, members, breakdown });
    }

    res.json({
      upcoming,
      teams: teamsEnriched,
      week: { from: iso(monday), to: iso(sunday) },
    });
  },
};
