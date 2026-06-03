/**
 * Planner solver — propose un planning automatique pour une semaine
 * donnée, en respectant les heures cibles de chaque membre et la
 * couverture minimum de chaque service.
 *
 * Algorithme : **greedy avec scoring multi-critères**.
 *   1. Construire la liste des "slots" à pourvoir (jour × shift_type × poste × n)
 *   2. Trier les slots par ordre de difficulté (vendredi soir > mardi midi…)
 *   3. Pour chaque slot, trouver le meilleur candidat parmi les membres
 *      éligibles (poste compatible, pas déjà sur ce shift, heures cibles
 *      non dépassées, pas plus de 6 jours consécutifs travaillés)
 *   4. Si aucun candidat : marquer le slot comme uncovered (warning)
 *
 * Le scoring favorise :
 *   - Les membres dont le déficit d'heures est le plus grand
 *   - Les membres dont le shift_default correspond au slot
 *   - Les membres dont le poste habituel correspond au slot (vs admin)
 */
import { SHIFT_DURATIONS, SERVICE_COVERAGE, DEFAULT_CLOSED_DAYS } from '../config/constants.js';

const MAX_CONSECUTIVE_DAYS = 6;

/**
 * @param {Object} input
 * @param {Array<{user_id, first_name, role, is_admin, poste, shift_default, weekly_hours_target}>} input.members
 * @param {Array<string>} input.weekDates    Dates ISO YYYY-MM-DD (lundi → dimanche)
 * @param {Array<Object>} input.existingShifts  Shifts déjà présents (à conserver)
 * @param {Array<number>} [input.closedDays]    Jours fermés (0=dim,1=lun,…) défaut [1]
 * @param {Object} [input.coverage]              Override SERVICE_COVERAGE
 *
 * @returns {{ suggested: Array<Object>, uncovered: Array<Object>, hours: Object }}
 *   - suggested : nouveaux shifts à créer
 *   - uncovered : slots non pourvus (manque candidat)
 *   - hours     : { user_id: { target, planned } }
 */
export function generatePlan(input) {
  const {
    members = [],
    weekDates = [],
    existingShifts = [],
    closedDays = DEFAULT_CLOSED_DAYS,
    coverage = SERVICE_COVERAGE,
  } = input;

  // ── 1. Calcul des heures déjà planifiées pour chaque membre ──────
  const hours = {};
  for (const m of members) {
    hours[m.user_id] = {
      target: m.weekly_hours_target || 0,
      planned: 0,
    };
  }
  for (const s of existingShifts) {
    if (hours[s.user_id]) {
      hours[s.user_id].planned += SHIFT_DURATIONS[s.shift_type] || 0;
    }
  }

  // ── 2. Build slot list ───────────────────────────────────────────
  const slots = [];
  for (const date of weekDates) {
    const dow = new Date(date).getDay();
    if (closedDays.includes(dow)) continue;
    for (const [shift_type, postesNeeded] of Object.entries(coverage)) {
      for (const [poste, minCount] of Object.entries(postesNeeded)) {
        // Compter combien sont déjà couverts par les existing
        const alreadyCovered = existingShifts.filter(
          (s) => s.date.startsWith(date) && s.shift_type === shift_type && s.poste === poste,
        ).length;
        const stillNeeded = Math.max(0, minCount - alreadyCovered);
        for (let i = 0; i < stillNeeded; i++) {
          slots.push({ date, shift_type, poste, dow });
        }
      }
    }
  }

  // ── 3. Trier les slots par contrainte décroissante ───────────────
  //    (les plus dur à pourvoir d'abord pour éviter d'être bloqué)
  slots.sort((a, b) => {
    // Vendredi soir > samedi soir > autres soirs > midi
    const score = (s) => {
      let v = 0;
      if (s.shift_type === 'soir') v += 10;
      if (s.shift_type === 'nuit') v += 8;
      if (s.dow === 5 || s.dow === 6) v += 5;   // ven/sam
      if (s.poste === 'cuisine') v += 3;         // peu de cuisiniers
      if (s.poste === 'plonge') v += 2;
      return v;
    };
    return score(b) - score(a);
  });

  // ── 4. Trackers ──────────────────────────────────────────────────
  // shifts assignés par (user_id, date) pour éviter double-booking
  const assignedByUserDay = new Map();    // "userId-date" -> Set of shift_type
  // Compteur jours consécutifs travaillés
  const daysWorked = new Map();           // userId -> Set of dates
  for (const s of existingShifts) {
    const date = s.date.slice(0, 10);
    const key = `${s.user_id}-${date}`;
    if (!assignedByUserDay.has(key)) assignedByUserDay.set(key, new Set());
    assignedByUserDay.get(key).add(s.shift_type);
    if (!daysWorked.has(s.user_id)) daysWorked.set(s.user_id, new Set());
    daysWorked.get(s.user_id).add(date);
  }

  // ── 5. Assignment loop ───────────────────────────────────────────
  const suggested = [];
  const uncovered = [];

  for (const slot of slots) {
    const candidates = members
      .filter((m) => {
        // Cadres (admin avec target=0) exclus
        if (!m.weekly_hours_target || m.weekly_hours_target === 0) return false;
        // Poste compatible : même poste OU bar/cuisine peuvent overlapper
        const posteOk = m.poste === slot.poste
          || (slot.poste === 'bar' && m.poste === 'salle')
          || (slot.poste === 'plonge' && m.poste === 'cuisine');
        if (!posteOk) return false;
        // Pas déjà sur ce shift_type ce jour-là
        const key = `${m.user_id}-${slot.date}`;
        if (assignedByUserDay.get(key)?.has(slot.shift_type)) return false;
        // Heures restantes suffisantes (tolérance +2h au-delà du target)
        const wouldBe = hours[m.user_id].planned + (SHIFT_DURATIONS[slot.shift_type] || 0);
        if (wouldBe > m.weekly_hours_target + 2) return false;
        // Max 6 jours consécutifs
        const userDays = daysWorked.get(m.user_id) || new Set();
        if (countConsecutive([...userDays, slot.date]) > MAX_CONSECUTIVE_DAYS) return false;
        return true;
      })
      .map((m) => {
        // Score : plus le déficit est grand, plus la priorité est haute
        const deficit = m.weekly_hours_target - hours[m.user_id].planned;
        let score = deficit * 10;                                    // facteur principal
        if (m.shift_default === slot.shift_type) score += 5;         // préférence
        if (m.poste === slot.poste) score += 3;                      // poste exact
        return { member: m, score };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      uncovered.push({ ...slot, reason: 'aucun équipier éligible' });
      continue;
    }

    const chosen = candidates[0].member;
    const shift = {
      family_id: existingShifts[0]?.family_id || null,
      user_id: chosen.user_id,
      first_name: chosen.first_name,
      date: slot.date,
      shift_type: slot.shift_type,
      poste: slot.poste,
      note: 'Proposé par le solver',
      _suggested: true,
    };
    suggested.push(shift);

    // Update trackers
    hours[chosen.user_id].planned += SHIFT_DURATIONS[slot.shift_type] || 0;
    const key = `${chosen.user_id}-${slot.date}`;
    if (!assignedByUserDay.has(key)) assignedByUserDay.set(key, new Set());
    assignedByUserDay.get(key).add(slot.shift_type);
    if (!daysWorked.has(chosen.user_id)) daysWorked.set(chosen.user_id, new Set());
    daysWorked.get(chosen.user_id).add(slot.date);
  }

  return { suggested, uncovered, hours };
}

/**
 * Calcule le nombre maximum de jours consécutifs à partir d'une
 * liste de dates ISO.
 */
function countConsecutive(dates) {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let maxStreak = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 1;
    }
  }
  return maxStreak;
}

/**
 * Calcule le résumé heures + couverture pour une semaine,
 * sans rien modifier (utile pour l'API summary).
 *
 * @returns {{ memberStats: Array, coverageGaps: Array }}
 */
export function computeSummary({ members, weekDates, existingShifts, closedDays = DEFAULT_CLOSED_DAYS, coverage = SERVICE_COVERAGE }) {
  const hours = {};
  for (const m of members) {
    hours[m.user_id] = {
      user_id: m.user_id,
      first_name: m.first_name,
      last_name: m.last_name,
      poste: m.poste,
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

  const coverageGaps = [];
  for (const date of weekDates) {
    const dow = new Date(date).getDay();
    if (closedDays.includes(dow)) continue;
    for (const [shift_type, postesNeeded] of Object.entries(coverage)) {
      for (const [poste, minCount] of Object.entries(postesNeeded)) {
        const got = existingShifts.filter(
          (s) => s.date.startsWith(date) && s.shift_type === shift_type && s.poste === poste,
        ).length;
        if (got < minCount) {
          coverageGaps.push({ date, shift_type, poste, missing: minCount - got });
        }
      }
    }
  }

  return { memberStats, coverageGaps };
}
