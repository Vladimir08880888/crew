/**
 * Calendar controller — version Crew (shifts uniquement).
 *
 * Expose un flux iCal (RFC 5545) pour chaque utilisateur :
 *   - /api/calendar/:token            → tous les shifts de l'utilisateur
 *   - /api/calendar/:token/team/:teamId.ics → shifts d'une équipe
 *
 * Auth : pas de JWT, c'est le calendar_token (URL) qui identifie
 * l'utilisateur. Endpoint en lecture seule.
 */
import { userModel } from '../models/user.model.js';
import { teamModel } from '../models/team.model.js';
import { shiftModel } from '../models/shift.model.js';
import { buildIcal } from '../services/ical.service.js';
import { notFound, forbidden } from '../utils/httpError.js';

function sendIcs(res, ics, name) {
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', `inline; filename="${name}"`);
  res.send(ics);
}

async function userFromToken(token) {
  const cleaned = token.replace(/\.ics$/, '');
  const user = await userModel.findByCalendarToken(cleaned);
  if (!user) throw notFound('Calendrier introuvable');
  return user;
}

export const calendarController = {
  /**
   * Flux principal — tous les shifts à venir de l'utilisateur,
   * toutes équipes confondues.
   */
  async export(req, res) {
    const user = await userFromToken(req.params.token);
    const shifts = await shiftModel.listUpcomingForUser(user.id, 100);
    const ics = buildIcal({
      ownerName: `${user.first_name} ${user.last_name}`,
      tasks: [],
      shifts,
    });
    sendIcs(res, ics, `crew-${user.first_name}.ics`);
  },

  /**
   * Sub-feed — shifts d'une équipe spécifique uniquement.
   */
  async exportTeam(req, res) {
    const user = await userFromToken(req.params.token);
    const teamId = Number(req.params.teamId);
    const team = await teamModel.findById(teamId);
    if (!team) throw notFound('Équipe introuvable');

    const isMember = await teamModel.listForUser(user.id);
    if (!isMember.find((f) => f.id === teamId && f.status === 'active')) {
      throw forbidden("Pas membre de cette équipe");
    }

    const shifts = await shiftModel.listByTeam({
      teamId,
      from: new Date().toISOString().slice(0, 10),
      to:   new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
      userId: user.id,
    });

    const ics = buildIcal({
      ownerName: `${user.first_name} ${user.last_name}`,
      calendarName: `Crew — ${team.name}`,
      calendarColor: '#c3553a',
      tasks: [],
      shifts,
    });
    sendIcs(res, ics, `crew-${team.name.replace(/\s+/g, '-')}.ics`);
  },
};
