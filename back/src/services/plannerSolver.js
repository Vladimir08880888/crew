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

import { SHIFT_DURATIONS, DEFAULT_CLOSED_DAYS, PLANNING_SHIFTS, PLANNING_POSTES, POSTES } from '../config/constants.js';

const MAX_CONSECUTIVE_DAYS = 6;

// Plafonds de la Convention collective HCR du 30 avril 1997
// et du Code du travail L3121-20.
const HCR_WEEKLY_MAX = 48;             // h absolu sur une semaine
const HCR_MIN_REST_DAYS = 2;           // jours/semaine
const HCR_DAILY_MAX_BY_POSTE = {       // h effectives par jour
  administration: 10,
  cuisine:        11,    // cuisinier
  plonge:         11.5,  // « autre personnel »
  salle:          11.5,
  bar:            11.5,
};
function hcrDailyCap(poste) { return HCR_DAILY_MAX_BY_POSTE[poste] ?? 11.5; }

// Référence : chaque poste vise 100 (centièmes, soit 1,00 = 100 %).
// Les poids individuels sont strictement < 100 → tout est en fraction
// d'« équipe pleine » par poste.
const DEFAULT_SETTINGS = {
  junior_coef: 15,
  confirme_coef: 40,
  chef_coef: 60,
  max_couverts: 100,
  midi_cuisine_ideal: 100,
  midi_salle_ideal:   100,
  soir_cuisine_ideal: 100,
  soir_salle_ideal:   100,
  // Taux horaires en centimes d'euro (Convention HCR 2026, minima sectoriels).
  junior_rate:   1200,
  confirme_rate: 1400,
  chef_rate:     1900,
};
// Poids de la pénalité « coût » dans le score de candidature.
// 1.0 = un shift Junior à 12 €/h ≈ -12 pts de score → comparable au
// bonus shift_default (+5) et poste exact (+3). En pratique, le déficit
// hebdo (×10) reste dominant tant qu'il existe ; le coût départage les
// candidats à déficit comparable. Configurable côté serveur si besoin.
const COST_PENALTY_WEIGHT = 1.0;

function coefOf(member, settings) {
  // Override personnel prime sur la valeur du niveau.
  if (member.coef_override != null) return Number(member.coef_override);
  switch (member.level) {
    case 'junior':   return settings.junior_coef;
    case 'chef':     return settings.chef_coef;
    case 'confirme':
    default:         return settings.confirme_coef;
  }
}

// Taux horaire en centimes/€. Override personnel prime sur le taux du
// niveau défini en settings de l'équipe.
function rateOf(member, settings) {
  if (member.rate_override != null) return Number(member.rate_override);
  switch (member.level) {
    case 'junior':   return settings.junior_rate ?? 1200;
    case 'chef':     return settings.chef_rate ?? 1900;
    case 'confirme':
    default:         return settings.confirme_rate ?? 1400;
  }
}
// Coût d'un shift en centimes : rate (cents/h) × durée (h).
function shiftCost(member, service, settings) {
  return rateOf(member, settings) * (SHIFT_DURATIONS[service] || 0);
}

function idealOf(settings, service, poste) {
  return settings[`${service}_${poste}_ideal`] || 0;
}

// Polyvalence : un équipier peut tenir un poste s'il a la compétence.
//   - skills_mask = bitmask des postes (POSTES) qu'il maîtrise.
//   - NULL → on retombe sur l'ancien comportement (poste primaire +
//     plonge → cuisine pour le seed historique).
function canFill(member, slotPoste) {
  if (member.skills_mask != null) {
    const slotIdx = POSTES.indexOf(slotPoste);
    if (slotIdx < 0) return false;
    return ((Number(member.skills_mask) >> slotIdx) & 1) === 1;
  }
  // Fallback legacy.
  if (member.poste === slotPoste) return true;
  if (slotPoste === 'cuisine' && member.poste === 'plonge') return true;
  return false;
}
// Alias rétro-compat pour la lecture sur existingShifts (qui n'ont pas
// de skills_mask) : c'est le poste enregistré sur le shift qui décide.
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
    capacityByService = {},
    capacityByDateAndService = {},
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

  // ────────────────────────────────────────────────────────────────────
  // Construction de la liste des slots ouverts.
  // ────────────────────────────────────────────────────────────────────
  const slots = [];
  for (const date of weekDates) {
    const dow = new Date(date).getDay();
    if (closedDays.includes(dow)) continue;

    for (const service of PLANNING_SHIFTS) {
      let capacityPct;
      const perCell = capacityByDateAndService?.[date]?.[service];
      if (perCell != null) capacityPct = Number(perCell);
      else if (capacityByService[service] != null) capacityPct = Number(capacityByService[service]);
      else if (capacityByDate[date] != null) capacityPct = Number(capacityByDate[date]);
      else capacityPct = 100;
      const capacityFactor = Math.max(0, Math.min(200, capacityPct)) / 100;

      for (const poste of PLANNING_POSTES) {
        const ideal = Math.round(idealOf(cfg, service, poste) * capacityFactor);
        if (ideal === 0) continue;

        const presentUsers = existingShifts
          .filter((s) => s.date.startsWith(date) && s.shift_type === service && posteMatches(s.poste, poste))
          .map((s) => memberById.get(s.user_id))
          .filter(Boolean);

        slots.push({
          date, service, poste, ideal,
          coefSum: presentUsers.reduce((sum, m) => sum + coefOf(m, cfg), 0),
          seniorPresent: presentUsers.some(isSenior),
          slotMembers: presentUsers.map((m) => ({
            user_id: m.user_id, level: m.level, first_name: m.first_name, source: 'existing',
          })),
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Solver multi-pass round-robin.
  //
  // Pourquoi pas du jour par jour ? Si on remplit Mardi → Mercredi → …,
  // les premiers jours saturent les heures de l'équipe (chacun arrive
  // près de sa cible contractuelle), et il ne reste rien pour Samedi /
  // Dimanche. Résultat : >120 % en début de semaine, 0 % en fin.
  //
  // À la place : à chaque passe, chaque slot encore sous-couvert reçoit
  // AU PLUS un équipier. On répète jusqu'à ce qu'aucune progression ne
  // soit possible. Garantit que toutes les journées reçoivent leur
  // « premier équipier » avant qu'un slot n'en obtienne un second.
  // ────────────────────────────────────────────────────────────────────
  function findBest(slot, targetTolerance = 2) {
    return members
      .filter((m) => {
        if (!m.weekly_hours_target || m.weekly_hours_target === 0) return false;
        if (!canFill(m, slot.poste)) return false;
        const akey = `${m.user_id}-${slot.date}`;
        if (assignedByUserDay.get(akey)?.has(slot.service)) return false;
        // Anti-overshoot : ne pas pousser un slot au-dessus de 130 %
        // juste pour combler un déficit ; mieux vaut laisser un autre
        // équipier moins gradé compléter (ou laisser le slot à 80 %).
        // Évite le « chef 60 ajouté sur slot à 80 % → 140 % ».
        const wouldBeCoverage = slot.coefSum + coefOf(m, cfg);
        if (wouldBeCoverage > slot.ideal * 1.3) return false;
        const shiftDur = SHIFT_DURATIONS[slot.service] || 0;
        const wouldBeWeek = hours[m.user_id].planned + shiftDur;
        // Cible contractuelle (préférence) — tolérance paramétrée
        // (par défaut +2 h ; relâchée à +5 h en phase de rattrapage).
        if (wouldBeWeek > m.weekly_hours_target + targetTolerance) return false;
        // HCR : plafond hebdomadaire absolu 48 h — JAMAIS relâché.
        if (wouldBeWeek > HCR_WEEKLY_MAX) return false;
        // HCR : plafond quotidien selon poste.
        const dayShifts = assignedByUserDay.get(akey) || new Set();
        const dayHours = [...dayShifts].reduce((sum, st) => sum + (SHIFT_DURATIONS[st] || 0), 0);
        if (dayHours + shiftDur > hcrDailyCap(m.poste)) return false;
        // HCR : minimum 2 jours de repos hebdo.
        const userDays = daysWorked.get(m.user_id) || new Set();
        const wouldDays = new Set([...userDays, slot.date]).size;
        if (weekDates.length >= 7 && weekDates.length - wouldDays < HCR_MIN_REST_DAYS) return false;
        // Max 6 jours consécutifs.
        if (countConsecutive([...userDays, slot.date]) > MAX_CONSECUTIVE_DAYS) return false;
        // Junior seul interdit.
        if (!slot.seniorPresent && !isSenior(m)
            && !slot.slotMembers.some((sm) => isSenior(memberById.get(sm.user_id)))) {
          return false;
        }
        return true;
      })
      .map((m) => {
        const deficit = m.weekly_hours_target - hours[m.user_id].planned;
        let score = deficit * 10;
        if (m.shift_default === slot.service) score += 5;
        if (m.poste === slot.poste) score += 3;
        if (m.level === 'chef') score += 2;
        const costEuros = shiftCost(m, slot.service, cfg) / 100;
        score -= costEuros * COST_PENALTY_WEIGHT;
        return { member: m, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.member ?? null;
  }

  // Boucle multi-pass : au moins un essai par slot tant qu'on progresse.
  // Deux phases avec tolérance horaire croissante pour atteindre la
  // meilleure couverture possible sans jamais franchir le mur HCR 48 h.
  //   Phase 1 (confort) : tolérance +2 h sur la cible contractuelle.
  //   Phase 2 (rattrapage) : tolérance étendue à +5 h pour couvrir les
  //     slots restants ; chacun voit son alerte « +X h » dans le récap.
  function assign(slot, chosen) {
    suggested.push({
      family_id: familyId,
      user_id: chosen.user_id,
      first_name: chosen.first_name,
      date: slot.date,
      shift_type: slot.service,
      poste: slot.poste,
      note: 'Proposé par le solver',
      _suggested: true,
    });
    slot.slotMembers.push({
      user_id: chosen.user_id, level: chosen.level,
      first_name: chosen.first_name, source: 'suggested',
    });
    slot.coefSum += coefOf(chosen, cfg);
    if (isSenior(chosen)) slot.seniorPresent = true;
    hours[chosen.user_id].planned += SHIFT_DURATIONS[slot.service] || 0;
    const akey = `${chosen.user_id}-${slot.date}`;
    if (!assignedByUserDay.has(akey)) assignedByUserDay.set(akey, new Set());
    assignedByUserDay.get(akey).add(slot.service);
    if (!daysWorked.has(chosen.user_id)) daysWorked.set(chosen.user_id, new Set());
    daysWorked.get(chosen.user_id).add(slot.date);
  }

  for (const tolerance of [2, 5]) {
    let progressed = true;
    let safetyGuard = 100;
    while (progressed && safetyGuard-- > 0) {
      progressed = false;
      // À chaque passe, on traite d'abord les slots les plus sous-couverts
      // (en proportion de leur idéal) — un slot vide est servi avant un
      // slot déjà à 70 % qui cherche son deuxième équipier.
      const ordered = [...slots]
        .filter((s) => s.coefSum < s.ideal)
        .sort((a, b) => (a.coefSum / a.ideal) - (b.coefSum / b.ideal));
      for (const slot of ordered) {
        const chosen = findBest(slot, tolerance);
        if (!chosen) continue;
        assign(slot, chosen);
        progressed = true;
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Passe d'équilibrage finale.
  //
  // Tant qu'il existe au moins une paire (slot sur-couvert, slot
  // sous-couvert), on essaie de déplacer un équipier suggéré de l'un
  // vers l'autre — en commençant par le moins gradé (impact minimal
  // sur les deux côtés). Le déplacement n'est exécuté que s'il réduit
  // l'écart total à l'idéal et respecte toutes les contraintes HCR +
  // métier.
  //
  // Effet : ramène les slots à 115 % vers 100 % tout en rehaussant
  // les slots à 80 % vers 95 % — sans dépasser le mur HCR 48 h.
  // ────────────────────────────────────────────────────────────────────
  function tryMove(member, fromSlot, toSlot) {
    if (!canFill(member, toSlot.poste)) return false;
    const akeyTo = `${member.user_id}-${toSlot.date}`;
    if (assignedByUserDay.get(akeyTo)?.has(toSlot.service)) return false;

    const fromDur = SHIFT_DURATIONS[fromSlot.service] || 0;
    const toDur = SHIFT_DURATIONS[toSlot.service] || 0;
    const wouldBeWeek = hours[member.user_id].planned - fromDur + toDur;
    if (wouldBeWeek > member.weekly_hours_target + 5) return false;
    if (wouldBeWeek > HCR_WEEKLY_MAX) return false;

    // Plafond quotidien sur la date d'arrivée.
    const dayShiftsTo = assignedByUserDay.get(akeyTo) || new Set();
    const dayHoursTo = [...dayShiftsTo].reduce((s, st) => s + (SHIFT_DURATIONS[st] || 0), 0);
    if (dayHoursTo + toDur > hcrDailyCap(member.poste)) return false;

    // Recalcul des jours travaillés après mouvement.
    const akeyFrom = `${member.user_id}-${fromSlot.date}`;
    const fromShiftsAfter = new Set(assignedByUserDay.get(akeyFrom) || []);
    fromShiftsAfter.delete(fromSlot.service);
    const userDays = new Set(daysWorked.get(member.user_id) || []);
    if (fromShiftsAfter.size === 0) userDays.delete(fromSlot.date);
    userDays.add(toSlot.date);
    if (weekDates.length >= 7 && weekDates.length - userDays.size < HCR_MIN_REST_DAYS) return false;
    if (countConsecutive([...userDays]) > MAX_CONSECUTIVE_DAYS) return false;

    // Anti-overshoot pour le toSlot (même règle que findBest).
    const memberCoef = coefOf(member, cfg);
    if (toSlot.coefSum + memberCoef > toSlot.ideal * 1.3) return false;

    // Gain d'équilibre : on déplace seulement si l'écart total baisse.
    const oldGap = Math.abs(fromSlot.coefSum - fromSlot.ideal)
                 + Math.abs(toSlot.coefSum   - toSlot.ideal);
    const newFrom = fromSlot.coefSum - memberCoef;
    const newTo   = toSlot.coefSum   + memberCoef;
    const newGap = Math.abs(newFrom - fromSlot.ideal)
                 + Math.abs(newTo   - toSlot.ideal);
    if (newGap >= oldGap) return false;

    // Junior-seul : si on retire un senior, vérifier qu'il en reste un
    // côté donor (ou qu'aucun junior n'est laissé seul).
    if (isSenior(member)) {
      const otherSeniors = fromSlot.slotMembers
        .some((sm) => sm.user_id !== member.user_id
                      && isSenior(memberById.get(sm.user_id)));
      const hasJunior = fromSlot.slotMembers
        .some((sm) => sm.user_id !== member.user_id
                      && !isSenior(memberById.get(sm.user_id)));
      if (!otherSeniors && hasJunior) return false;
    }
    // Et côté receiver : si on amène un junior sur un slot sans senior,
    // refuser.
    if (!isSenior(member) && !toSlot.seniorPresent
        && !toSlot.slotMembers.some((sm) => isSenior(memberById.get(sm.user_id)))) {
      return false;
    }

    // ── EXÉCUTION du mouvement ──
    // Retirer du donor.
    const idxFrom = fromSlot.slotMembers
      .findIndex((sm) => sm.user_id === member.user_id);
    if (idxFrom >= 0) fromSlot.slotMembers.splice(idxFrom, 1);
    fromSlot.coefSum -= memberCoef;
    fromSlot.seniorPresent = fromSlot.slotMembers
      .some((sm) => isSenior(memberById.get(sm.user_id)));

    // Retirer le shift correspondant de suggested[].
    const sugIdx = suggested.findIndex((s) =>
      s.user_id === member.user_id
      && s.date === fromSlot.date
      && s.shift_type === fromSlot.service
      && s.poste === fromSlot.poste);
    if (sugIdx >= 0) suggested.splice(sugIdx, 1);

    // Mettre à jour assignedByUserDay + daysWorked + heures du donor.
    assignedByUserDay.get(akeyFrom)?.delete(fromSlot.service);
    if (assignedByUserDay.get(akeyFrom)?.size === 0) {
      assignedByUserDay.delete(akeyFrom);
      daysWorked.get(member.user_id)?.delete(fromSlot.date);
    }
    hours[member.user_id].planned -= fromDur;

    // Ajouter au receiver.
    toSlot.slotMembers.push({
      user_id: member.user_id, level: member.level,
      first_name: member.first_name, source: 'suggested',
    });
    toSlot.coefSum += memberCoef;
    if (isSenior(member)) toSlot.seniorPresent = true;
    suggested.push({
      family_id: familyId,
      user_id: member.user_id,
      first_name: member.first_name,
      date: toSlot.date,
      shift_type: toSlot.service,
      poste: toSlot.poste,
      note: 'Proposé par le solver (rééquilibrage)',
      _suggested: true,
    });
    if (!assignedByUserDay.has(akeyTo)) assignedByUserDay.set(akeyTo, new Set());
    assignedByUserDay.get(akeyTo).add(toSlot.service);
    if (!daysWorked.has(member.user_id)) daysWorked.set(member.user_id, new Set());
    daysWorked.get(member.user_id).add(toSlot.date);
    hours[member.user_id].planned += toDur;

    return true;
  }

  // Boucle d'équilibrage : un mouvement par tour, max 50 tours.
  let balanceGuard = 50;
  while (balanceGuard-- > 0) {
    const overSlots = slots.filter((s) => s.coefSum > s.ideal);
    const underSlots = slots
      .filter((s) => s.coefSum < s.ideal)
      .sort((a, b) => (a.coefSum / a.ideal) - (b.coefSum / b.ideal));
    if (overSlots.length === 0 || underSlots.length === 0) break;

    let moved = false;
    outer: for (const donor of overSlots) {
      // On essaie d'abord de retirer les équipiers les moins gradés
      // — impact minimal sur donor, et léger boost sur receiver.
      const candidates = donor.slotMembers
        .filter((sm) => sm.source === 'suggested')
        .map((sm) => memberById.get(sm.user_id))
        .filter(Boolean)
        .sort((a, b) => coefOf(a, cfg) - coefOf(b, cfg));
      for (const member of candidates) {
        for (const receiver of underSlots) {
          if (tryMove(member, donor, receiver)) {
            moved = true;
            break outer;
          }
        }
      }
    }
    if (!moved) break;
  }

  // Construction de la coverage / uncovered à partir de l'état final.
  for (const slot of slots) {
    coverage.push({
      date: slot.date, service: slot.service, poste: slot.poste,
      ideal: slot.ideal, actual_coef: slot.coefSum, members: slot.slotMembers,
    });
    if (slot.coefSum < slot.ideal / 2) {
      uncovered.push({
        date: slot.date, service: slot.service, poste: slot.poste,
        ideal: slot.ideal, actual_coef: slot.coefSum,
        reason: 'Aucun équipier éligible sans enfreindre la Convention HCR (heures, repos hebdo, junior seul).',
      });
    }
  }

  return { suggested, uncovered, hours, coverage };
}

/**
 * Récap pour l'API summary — purement lecture sur les shifts existants.
 * Retourne memberStats (heures/cibles) et coverage par (date,service,poste)
 * pour le dashboard.
 */
export function computeSummary({ members, weekDates, existingShifts, settings = DEFAULT_SETTINGS, closedDays = DEFAULT_CLOSED_DAYS, capacityByDate = {}, capacityByService = {}, capacityByDateAndService = {} }) {
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

  // Masse salariale : par équipier et total semaine (en euros).
  let laborCostTotal = 0;
  for (const m of members) {
    const h = hours[m.user_id];
    if (!h) continue;
    const rate = rateOf(m, cfg);
    h.rate_eur = rate / 100;
    h.cost_eur = +((h.planned * rate) / 100).toFixed(2);
    laborCostTotal += h.cost_eur;
  }
  laborCostTotal = +laborCostTotal.toFixed(2);

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

    for (const service of PLANNING_SHIFTS) {
      let capacityPct;
      if (capacityByService[service] != null) capacityPct = Number(capacityByService[service]);
      else if (capacityByDate[date] != null) capacityPct = Number(capacityByDate[date]);
      else capacityPct = 100;
      const capacityFactor = Math.max(0, Math.min(200, capacityPct)) / 100;

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

  // Couverture par service = moyenne des couvertures (cuisine + salle).
  // Chaque poste vise 1,0 (100 %) indépendamment. La couverture globale du
  // service est leur moyenne, ce qui donne au manager une vision agrégée
  // tout en gardant la lecture détaillée par poste dans la table coverage.
  const overallService = []; // [{ date, service, posteCount, sum_pct, avg_pct }]
  const overallAcc = {}; // key date|service -> { sum, count }
  for (const c of coverage) {
    const key = `${c.date}|${c.service}`;
    if (!overallAcc[key]) overallAcc[key] = { sum: 0, count: 0 };
    const pct = c.ideal > 0 ? (c.actual_coef / c.ideal) * 100 : 0;
    overallAcc[key].sum += pct;
    overallAcc[key].count += 1;
  }
  for (const [key, v] of Object.entries(overallAcc)) {
    const [date, service] = key.split('|');
    const avg = v.count ? Math.round(v.sum / v.count) : 0;
    overallService.push({ date, service, posteCount: v.count, avg_pct: avg });
  }

  // ── 1. Détecteur de surcharge soutenue (KC & Terwiesch 2009 — K=4h).
  //    Si midi ET soir d'un même jour sont chargés à >120 %, on considère
  //    que la fenêtre d'overwork de 4h est franchie : la productivité de
  //    l'équipe commence à décrocher. Idem si 3 services chargés sur 4 jours
  //    consécutifs (signal de surcharge soutenue à l'échelle hebdo).
  const fatigueAlerts = [];
  const dayLoad = {}; // date -> { midi: % max sur postes, soir: ... }
  for (const c of coverage) {
    const pct = c.ideal > 0 ? Math.round((c.actual_coef / c.ideal) * 100) : 0;
    if (!dayLoad[c.date]) dayLoad[c.date] = {};
    dayLoad[c.date][c.service] = Math.max(dayLoad[c.date][c.service] || 0, pct);
  }
  for (const [date, ld] of Object.entries(dayLoad)) {
    if ((ld.midi || 0) >= 120 && (ld.soir || 0) >= 120) {
      fatigueAlerts.push({
        date, type: 'double_charge_day',
        severity: 'high',
        reason: `Midi (${ld.midi} %) ET soir (${ld.soir} %) au-dessus de 120 % le même jour.`,
        citation: 'KC & Terwiesch (2009), Management Science 55(9):1486-1498 — fenêtre d\'overwork K=4h.',
      });
    }
  }
  // Surcharge hebdomadaire : ≥3 services Chargé (≥130 %) sur 7 jours.
  const chargedCount = Object.values(dayLoad).reduce(
    (n, ld) => n + ((ld.midi || 0) >= 130 ? 1 : 0) + ((ld.soir || 0) >= 130 ? 1 : 0),
    0
  );
  if (chargedCount >= 3) {
    fatigueAlerts.push({
      type: 'weekly_overload',
      severity: chargedCount >= 5 ? 'high' : 'medium',
      count: chargedCount,
      reason: `${chargedCount} services chargés (≥130 %) cette semaine — burnout cumulatif probable.`,
      citation: 'Wen et al. (2020), Front. Psychol. — surcharge soutenue → burnout β=0,83.',
    });
  }

  // ── 2. Conformité HCR (convention collective Hôtels-Cafés-Restaurants).
  //    Sources :
  //    - Convention HCR du 30/04/1997 : max quotidien selon poste,
  //      max hebdomadaire 48 h absolu / 46 h moyenne 12 sem, 2 jours
  //      de repos hebdo minimum.
  //    - Code du travail L3121-20 : 48 h plafond hebdomadaire.
  //    Les seuils sont définis en tête de module (HCR_*) et partagés
  //    avec le solver pour qu'il n'engendre jamais de violation.
  const hcrViolations = [];
  for (const m of members) {
    const userShifts = existingShifts.filter((s) => s.user_id === m.user_id);
    const distinctDays = new Set(userShifts.map((s) => s.date.slice(0, 10)));
    const weekHours = userShifts.reduce((sum, s) => sum + (SHIFT_DURATIONS[s.shift_type] || 0), 0);
    const hoursPerDay = {};
    for (const s of userShifts) {
      const d = s.date.slice(0, 10);
      hoursPerDay[d] = (hoursPerDay[d] || 0) + (SHIFT_DURATIONS[s.shift_type] || 0);
    }
    const maxDayHours = Math.max(0, ...Object.values(hoursPerDay));
    const restDays = Math.max(0, weekDates.length - distinctDays.size);
    const dailyCap = hcrDailyCap(m.poste);

    if (weekHours > HCR_WEEKLY_MAX) hcrViolations.push({
      user_id: m.user_id, name: `${m.first_name} ${m.last_name || ''}`.trim(),
      type: 'weekly_hours', value: weekHours, threshold: HCR_WEEKLY_MAX, severity: 'high',
      reason: `${weekHours} h cette semaine — dépasse le plafond légal de ${HCR_WEEKLY_MAX} h.`,
      citation: 'Convention HCR + Code du travail L3121-20 : 48 h hebdo absolu.',
    });
    else if (weekHours > 46) hcrViolations.push({
      user_id: m.user_id, name: `${m.first_name} ${m.last_name || ''}`.trim(),
      type: 'weekly_hours_avg', value: weekHours, threshold: 46, severity: 'medium',
      reason: `${weekHours} h cette semaine — au-dessus de la moyenne maximale 46 h/12 sem.`,
      citation: 'Convention HCR : 46 h en moyenne sur 12 semaines consécutives.',
    });
    if (maxDayHours > dailyCap) hcrViolations.push({
      user_id: m.user_id, name: `${m.first_name} ${m.last_name || ''}`.trim(),
      type: 'daily_hours', value: maxDayHours, threshold: dailyCap, severity: 'high',
      reason: `${maxDayHours} h sur une journée — dépasse ${dailyCap} h (${m.poste || 'poste'}).`,
      citation: `Convention HCR — max quotidien ${dailyCap} h pour le poste « ${m.poste || 'autre'} ».`,
    });
    if (m.weekly_hours_target > 0 && restDays < HCR_MIN_REST_DAYS && weekDates.length >= 7) hcrViolations.push({
      user_id: m.user_id, name: `${m.first_name} ${m.last_name || ''}`.trim(),
      type: 'rest_days', value: restDays, threshold: 2, severity: 'high',
      reason: `Seulement ${restDays} jour(s) de repos cette semaine — non-conforme.`,
      citation: 'Convention collective HCR — minimum 2 jours de repos hebdomadaire.',
    });
  }

  // ── 3. Score de santé du service (composite 0-100).
  //    Combine couverture (pénalité si < idéal), surcharge (pénalité si > 150 %)
  //    et présence d'une violation HCR sur ce shift.
  const serviceHealth = [];
  for (const [date, ld] of Object.entries(dayLoad)) {
    for (const service of PLANNING_SHIFTS) {
      const pct = ld[service];
      if (pct == null) continue;
      let score = 100;
      if (pct < 50)      score -= 60;       // sous-couverture critique
      else if (pct < 80) score -= 30;       // tension visible
      else if (pct > 150) score -= 25;      // surcharge
      else if (pct > 130) score -= 10;
      // Si une violation HCR concerne ce service.
      const todaysHCR = hcrViolations.filter((v) => v.type === 'daily_hours' || v.type === 'rest_days').length;
      if (todaysHCR > 0) score -= 15;
      score = Math.max(0, Math.min(100, score));
      const level = score >= 75 ? 'saine' : score >= 45 ? 'tendue' : 'risque';
      serviceHealth.push({ date, service, load_pct: pct, score, level });
    }
  }

  return { memberStats, coverage, overallService, laborCostTotal, fatigueAlerts, hcrViolations, serviceHealth };
}
