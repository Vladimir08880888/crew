/**
 * Smart Planner — solver d'auto-planning Crew.
 *
 * Le solver lit la configuration de l'établissement (table `families`,
 * colonnes ajoutées en migration 007) plutôt que des constantes
 * hardcodées. Pour chaque (jour, service, poste) il calcule la cible
 * de couverture en COEFFICIENTS (somme à atteindre) puis remplit avec
 * les équipiers les plus prioritaires en respectant :
 *
 *   - les heures contractuelles (tolérance +2h),
 *   - max 6 jours travaillés consécutifs,
 *   - un poste compatible (cuisine ∋ plonge),
 *   - JAMAIS un junior seul sur un poste : il faut au minimum un
 *     confirmé ou un chef présent sur le même créneau-poste.
 *
 * Capacité variable : le manager peut passer un `capacityByDate`
 * (% de la capacité de référence par jour) pour signaler les services
 * tranquilles — la cible est multipliée par ce pourcentage.
 */

import { SHIFT_DURATIONS, DEFAULT_CLOSED_DAYS, PLANNING_SHIFTS, PLANNING_POSTES } from '../config/constants.js';

const MAX_CONSECUTIVE_DAYS = 6;

const DEFAULT_SETTINGS = {
  junior_coef: 50,
  confirme_coef: 100,
  chef_coef: 150,
  max_couverts: 100,
  midi_cuisine_ideal: 200,
  midi_salle_ideal:   300,
  soir_cuisine_ideal: 300,
  soir_salle_ideal:   400,
};

function coefOf(member, settings) {
  switch (member.level) {
    case 'junior':   return settings.junior_coef;
    case 'chef':     return settings.chef_coef;
    case 'confirme':
    default:         return settings.confirme_coef;
  }
}

function idealOf(settings, service, poste) {
  return settings[`${service}_${poste}_ideal`] || 0;
}

// Un poste = même valeur OU plonge → assimilée à cuisine.
function posteMatches(memberPoste, slotPoste) {
  if (memberPoste === slotPoste) return true;
  if (slotPoste === 'cuisine' && memberPoste === 'plonge') return true;
  return false;
}

function isSenior(member) {
  return member.level === 'confirme' || member.level === 'chef';
}

function countConsecutive(dates) {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let maxStreak = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) { streak++; if (streak > maxStreak) maxStreak = streak; }
    else streak = 1;
  }
  return maxStreak;
}

/**
 * @param {Object} input
 * @param {Array} input.members         — équipiers de l'équipe
 * @param {Array<string>} input.weekDates — dates ISO YYYY-MM-DD
 * @param {Array} input.existingShifts  — shifts déjà présents (préservés)
 * @param {Object} input.settings       — config famille (coefs + ideals)
 * @param {Array<number>} [input.closedDays] — jours fermés (0=dim,1=lun,…)
 * @param {Object} [input.capacityByDate] — { 'YYYY-MM-DD': pct } override
 * @returns {{ suggested, uncovered, hours, coverage }}
 */
export function generatePlan(input) {
  const {
    members = [],
    weekDates = [],
    existingShifts = [],
    settings = DEFAULT_SETTINGS,
    closedDays = DEFAULT_CLOSED_DAYS,
    capacityByDate = {},
  } = input;

  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  const familyId = existingShifts[0]?.family_id || null;

  // Index utile pour retrouver le level d'un user à partir des shifts existants.
  const memberById = new Map();
  for (const m of members) memberById.set(m.user_id, m);

  // Suivi des heures planifiées par membre (à jour avec existing puis suggested).
  const hours = {};
  for (const m of members) {
    hours[m.user_id] = {
      first_name: m.first_name,
      last_name:  m.last_name,
      level:      m.level || 'confirme',
      target:     m.weekly_hours_target || 0,
      planned:    0,
    };
  }
  for (const s of existingShifts) {
    if (hours[s.user_id]) hours[s.user_id].planned += SHIFT_DURATIONS[s.shift_type] || 0;
  }

  // Suivi des affectations (date,service) déjà occupées par un user
  // et des jours travaillés par user.
  const assignedByUserDay = new Map();   // userId-date -> Set(shift_type)
  const daysWorked = new Map();          // userId -> Set(date)
  for (const s of existingShifts) {
    const date = s.date.slice(0, 10);
    const key = `${s.user_id}-${date}`;
    if (!assignedByUserDay.has(key)) assignedByUserDay.set(key, new Set());
    assignedByUserDay.get(key).add(s.shift_type);
    if (!daysWorked.has(s.user_id)) daysWorked.set(s.user_id, new Set());
    daysWorked.get(s.user_id).add(date);
  }

  const suggested = [];
  const uncovered = [];
  const coverage  = []; // [{date, service, poste, ideal, actual_coef, members: [...] }]

  for (const date of weekDates) {
    const dow = new Date(date).getDay();
    if (closedDays.includes(dow)) continue;

    const capacityPct = capacityByDate[date] != null ? Number(capacityByDate[date]) : 100;
    const capacityFactor = Math.max(0, Math.min(200, capacityPct)) / 100;

    for (const service of PLANNING_SHIFTS) {
      for (const poste of PLANNING_POSTES) {
        const ideal = Math.round(idealOf(cfg, service, poste) * capacityFactor);
        if (ideal === 0) continue; // poste désactivé ce service

        // Membres déjà présents sur ce slot (issus de existingShifts).
        const presentUsers = existingShifts
          .filter((s) => s.date.startsWith(date) && s.shift_type === service && posteMatches(s.poste, poste))
          .map((s) => memberById.get(s.user_id))
          .filter(Boolean);

        let coefSum = presentUsers.reduce((sum, m) => sum + coefOf(m, cfg), 0);
        const seniorPresent = presentUsers.some(isSenior);
        const slotMembers = [...presentUsers.map((m) => ({ user_id: m.user_id, level: m.level, first_name: m.first_name, source: 'existing' }))];

        // Boucle d'ajout : on essaie d'atteindre ideal.
        while (coefSum < ideal) {
          // Candidats éligibles : poste compatible, hours OK, conséc. OK,
          // pas déjà assigné à (date, service).
          const candidates = members
            .filter((m) => {
              if (!m.weekly_hours_target || m.weekly_hours_target === 0) return false;
              if (!posteMatches(m.poste, poste)) return false;
              const akey = `${m.user_id}-${date}`;
              if (assignedByUserDay.get(akey)?.has(service)) return false;
              const wouldBe = hours[m.user_id].planned + (SHIFT_DURATIONS[service] || 0);
              if (wouldBe > m.weekly_hours_target + 2) return false;
              const userDays = daysWorked.get(m.user_id) || new Set();
              if (countConsecutive([...userDays, date]) > MAX_CONSECUTIVE_DAYS) return false;
              // Junior seul interdit : si aucun senior déjà présent ET ce candidat est junior, on saute.
              if (!seniorPresent && !isSenior(m) && !slotMembers.some((sm) => isSenior(memberById.get(sm.user_id)))) {
                return false;
              }
              return true;
            })
            .map((m) => {
              const deficit = m.weekly_hours_target - hours[m.user_id].planned;
              let score = deficit * 10;
              if (m.shift_default === service) score += 5;
              if (m.poste === poste) score += 3;             // poste exact (pas plonge sur cuisine)
              if (m.level === 'chef') score += 2;            // chef léger bonus en cuisine
              return { member: m, score };
            })
            .sort((a, b) => b.score - a.score);

          if (candidates.length === 0) break;

          const chosen = candidates[0].member;
          const shift = {
            family_id: familyId,
            user_id:   chosen.user_id,
            first_name: chosen.first_name,
            date,
            shift_type: service,
            poste,
            note: 'Proposé par le solver',
            _suggested: true,
          };
          suggested.push(shift);
          slotMembers.push({ user_id: chosen.user_id, level: chosen.level, first_name: chosen.first_name, source: 'suggested' });

          // Update trackers
          coefSum += coefOf(chosen, cfg);
          hours[chosen.user_id].planned += SHIFT_DURATIONS[service] || 0;
          const akey = `${chosen.user_id}-${date}`;
          if (!assignedByUserDay.has(akey)) assignedByUserDay.set(akey, new Set());
          assignedByUserDay.get(akey).add(service);
          if (!daysWorked.has(chosen.user_id)) daysWorked.set(chosen.user_id, new Set());
          daysWorked.get(chosen.user_id).add(date);
        }

        coverage.push({ date, service, poste, ideal, actual_coef: coefSum, members: slotMembers });
        if (coefSum < ideal / 2) {
          uncovered.push({ date, service, poste, ideal, actual_coef: coefSum, reason: 'couverture insuffisante (junior seul interdit, heures saturées)' });
        }
      }
    }
  }

  return { suggested, uncovered, hours, coverage };
}

/**
 * Récap pour l'API summary — purement lecture sur les shifts existants.
 * Retourne memberStats (heures/cibles) et coverage par (date,service,poste)
 * pour le dashboard.
 */
export function computeSummary({ members, weekDates, existingShifts, settings = DEFAULT_SETTINGS, closedDays = DEFAULT_CLOSED_DAYS, capacityByDate = {} }) {
  const cfg = { ...DEFAULT_SETTINGS, ...settings };
  const memberById = new Map();
  for (const m of members) memberById.set(m.user_id, m);

  const hours = {};
  for (const m of members) {
    hours[m.user_id] = {
      user_id: m.user_id,
      first_name: m.first_name,
      last_name: m.last_name,
      poste: m.poste,
      level: m.level || 'confirme',
      target: m.weekly_hours_target || 0,
      planned: 0,
      shifts_count: 0,
    };
  }
  for (const s of existingShifts) {
    const h = hours[s.user_id];
    if (h) {
      h.planned += SHIFT_DURATIONS[s.shift_type] || 0;
      h.shifts_count += 1;
    }
  }

  const memberStats = Object.values(hours).map((h) => ({
    ...h,
    delta: h.planned - h.target,
    status: h.target === 0 ? 'cadre'
          : h.planned === 0 ? 'no-shift'
          : Math.abs(h.planned - h.target) <= 2 ? 'ok'
          : h.planned > h.target ? 'over'
          : 'under',
  }));

  const coverage = [];
  for (const date of weekDates) {
    const dow = new Date(date).getDay();
    if (closedDays.includes(dow)) continue;
    const capacityPct = capacityByDate[date] != null ? Number(capacityByDate[date]) : 100;
    const capacityFactor = Math.max(0, Math.min(200, capacityPct)) / 100;

    for (const service of PLANNING_SHIFTS) {
      for (const poste of PLANNING_POSTES) {
        const ideal = Math.round(idealOf(cfg, service, poste) * capacityFactor);
        if (ideal === 0) continue;
        const present = existingShifts.filter(
          (s) => s.date.startsWith(date) && s.shift_type === service && posteMatches(s.poste, poste),
        );
        const actual_coef = present.reduce((sum, s) => sum + coefOf(memberById.get(s.user_id) || {}, cfg), 0);
        coverage.push({ date, service, poste, ideal, actual_coef, count: present.length });
      }
    }
  }

  return { memberStats, coverage };
}
