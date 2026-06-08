/**
 * Re-seed UNIQUEMENT la table shifts, sans toucher aux comptes
 * utilisateur ni aux équipes.
 *
 * À utiliser quand on a corrigé la logique de planning du seed et
 * qu'on veut nettoyer les shifts existants sans détruire les comptes
 * créés depuis (qui contiennent éventuellement le compte test du
 * candidat, des managers, etc.).
 *
 * Usage :
 *   docker exec -it <container> node src/db/reseed-shifts.js
 * ou via fly :
 *   fly ssh console -C "node src/db/reseed-shifts.js" --app crew-back
 */
import { pool } from './pool.js';

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
function dateInDays(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function findUserId(email) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  return rows[0]?.id ?? null;
}

async function findTeamId(name) {
  const [rows] = await pool.query('SELECT id FROM families WHERE name = ?', [name]);
  return rows[0]?.id ?? null;
}

// ────────────────────────────────────────────────────────────────────────
// Plan hebdo conforme HCR (≤ 48 h, ≥ 2 jours repos)
// ────────────────────────────────────────────────────────────────────────
async function reseed() {
  const teamId = await findTeamId('Bistrot du Vieux Port');
  if (!teamId) {
    console.error('[reseed-shifts] équipe Bistrot du Vieux Port introuvable');
    process.exit(1);
  }

  const ids = {};
  for (const email of [
    'julien.patron@bistrot.fr', 'sophie.manager@bistrot.fr',
    'ahmed.chef@bistrot.fr', 'elena.serveuse@bistrot.fr',
    'lucas.serveur@bistrot.fr', 'mehdi.commis@bistrot.fr',
    'samir.plonge@bistrot.fr', 'clara.commis@bistrot.fr',
  ]) {
    const id = await findUserId(email);
    if (!id) {
      console.error(`[reseed-shifts] utilisateur ${email} introuvable`);
      process.exit(1);
    }
    ids[email.split('.')[0]] = id;
  }

  console.log(`[reseed-shifts] team=${teamId}, users:`, ids);

  // Effacement chirurgical : seulement les shifts (preserve users, families, family_members).
  const [del] = await pool.query('DELETE FROM shifts WHERE family_id = ?', [teamId]);
  console.log(`[reseed-shifts] ${del.affectedRows} anciens shifts supprimés`);

  // Plan hebdo (alternance pour rester ≤ 48 h) — uniquement la semaine en cours,
  // la suivante reste vide pour démontrer le Smart Planner.
  const dayOfWeek = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getDay();
  };
  const ahmedDays = new Set([3, 4, 5, 0]);
  const sophieDays = new Set([2, 4, 5, 6]);

  const shifts = [];
  for (let offset = 0; offset < 7; offset++) {
    const dow = dayOfWeek(offset);
    if (dow === 1) continue; // lundi fermé

    const cuisineLead = ahmedDays.has(dow) ? ids.ahmed : ids.mehdi;
    const salleLead = sophieDays.has(dow) ? ids.sophie : ids.elena;

    shifts.push([offset, cuisineLead, 'midi', 'cuisine', null]);
    shifts.push([offset, salleLead,   'midi', 'salle',   null]);
    if (salleLead !== ids.elena) {
      shifts.push([offset, ids.elena,  'midi', 'salle',  null]);
    }
    shifts.push([offset, cuisineLead, 'soir', 'cuisine', null]);
    shifts.push([offset, ids.samir,   'soir', 'plonge',  null]);
    shifts.push([offset, ids.lucas,   'soir', 'salle',   null]);
    if (salleLead !== ids.lucas) {
      shifts.push([offset, salleLead, 'soir', 'salle',   null]);
    }
    if (dow === 5) {
      shifts.push([offset, ids.clara, 'soir', 'cuisine', 'Renfort vendredi soir']);
    }
  }

  let inserted = 0;
  for (const [offset, uid, st, poste, note] of shifts) {
    try {
      await pool.query(
        `INSERT INTO shifts (family_id, user_id, date, shift_type, poste, note, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, uid, dateInDays(offset), st, poste, note, ids.sophie],
      );
      inserted++;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err;
    }
  }

  console.log(`[reseed-shifts] ${inserted} nouveaux shifts insérés (HCR-compliant)`);
  await pool.end();
}

reseed().catch((err) => {
  console.error('[reseed-shifts] échec', err);
  process.exit(1);
});
