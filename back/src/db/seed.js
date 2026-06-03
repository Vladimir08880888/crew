/*
 * Crew — données de démonstration.
 *
 * Crée une équipe complète "Bistrot du Vieux Port" avec 8 membres
 * de différents rôles et un planning de 14 jours déjà rempli.
 * Permet de tester immédiatement le smart planner sans configurer
 * manuellement une équipe.
 *
 * Lancement : `npm run seed`
 *
 * ⚠️ Cette commande TRUNCATE les tables users/families/family_members/shifts.
 * À n'utiliser qu'en environnement de démo.
 */

import { pool } from './pool.js';
import { hashPassword } from '../services/password.service.js';
import { randomHex, randomInviteCode } from '../utils/randomToken.js';

async function clean() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE shifts');
  await pool.query('TRUNCATE TABLE family_members');
  await pool.query('TRUNCATE TABLE families');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('[seed] tables vidées');
}

async function createUser(email, firstName, lastName, plain) {
  const hash = await hashPassword(plain);
  const [r] = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, calendar_token)
     VALUES (?, ?, ?, ?, ?)`,
    [email, hash, firstName, lastName, randomHex(24)]
  );
  return r.insertId;
}

async function createFamily(name, createdBy) {
  const [r] = await pool.query(
    'INSERT INTO families (name, invite_code, created_by) VALUES (?, ?, ?)',
    [name, randomInviteCode(), createdBy]
  );
  return r.insertId;
}

async function addMember(familyId, userId, role, isAdmin = false, poste = null, shiftDefault = null, weeklyHours = null) {
  await pool.query(
    `INSERT INTO family_members (family_id, user_id, role, is_admin, status, poste, shift_default, weekly_hours_target)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
    [familyId, userId, role, isAdmin, poste, shiftDefault, weeklyHours]
  );
}

function dateInDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function run() {
  try {
    await clean();

    // ─────────────────────────────────────────────────────────────────
    // Équipe (8 membres) — exemple : restaurant « Bistrot du Vieux Port »
    // L'application est générique : peut servir pour hôtel, retail,
    // sécurité, santé, etc. La donnée démo est un restaurant car c'est
    // un exemple clair de planning avec rôles différenciés.
    // ─────────────────────────────────────────────────────────────────
    const julien = await createUser('julien.patron@bistrot.fr',  'Julien',  'Martin',   'motdepasse123');
    const sophie = await createUser('sophie.manager@bistrot.fr', 'Sophie',  'Bernard',  'motdepasse123');
    const ahmed  = await createUser('ahmed.chef@bistrot.fr',     'Ahmed',   'Kacimi',   'motdepasse123');
    const elena  = await createUser('elena.serveuse@bistrot.fr', 'Elena',   'Rossi',    'motdepasse123');
    const lucas  = await createUser('lucas.serveur@bistrot.fr',  'Lucas',   'Dubois',   'motdepasse123');
    const mehdi  = await createUser('mehdi.commis@bistrot.fr',   'Mehdi',   'Benali',   'motdepasse123');
    const clara  = await createUser('clara.commis@bistrot.fr',   'Clara',   'Petit',    'motdepasse123');
    const samir  = await createUser('samir.plonge@bistrot.fr',   'Samir',   'Lefebvre', 'motdepasse123');
    console.log('[seed] 8 membres créés');

    const team = await createFamily('Bistrot du Vieux Port', julien);
    // Patron (target=0 → exclu du solver automatique)
    await addMember(team, julien, 'parent', true,  'administration', null,    0);
    // Managers : heures cibles 42h
    await addMember(team, sophie, 'parent', false, 'salle',          'midi', 42);
    await addMember(team, ahmed,  'parent', false, 'cuisine',        'midi', 42);
    // Équipiers temps plein : 35h
    await addMember(team, elena,  'child',  false, 'salle',          'midi', 35);
    await addMember(team, lucas,  'child',  false, 'salle',          'soir', 35);
    await addMember(team, mehdi,  'child',  false, 'cuisine',        'midi', 35);
    await addMember(team, samir,  'child',  false, 'plonge',         'soir', 35);
    // Apprentie temps partiel : 24h
    await addMember(team, clara,  'child',  false, 'cuisine',        'soir', 24);
    console.log('[seed] Équipe « Bistrot du Vieux Port » créée (8 membres avec postes + heures cibles)');

    // ─────────────────────────────────────────────────────────────────
    // Planning de service — 14 jours à venir.
    // Lundi fermé. Mardi-Dimanche : service midi + soir.
    // Vendredi soir : renfort.
    // ─────────────────────────────────────────────────────────────────
    const dayOfWeek = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.getDay();
    };

    const shiftPlan = [];
    for (let offset = 0; offset < 14; offset++) {
      const dow = dayOfWeek(offset);
      if (dow === 1) continue;

      // Service midi
      shiftPlan.push([offset, julien, 'midi', 'administration', 'Permanence patron']);
      shiftPlan.push([offset, sophie, 'midi', 'salle',          null]);
      shiftPlan.push([offset, ahmed,  'midi', 'cuisine',        null]);
      shiftPlan.push([offset, elena,  'midi', 'salle',          null]);
      shiftPlan.push([offset, mehdi,  'midi', 'cuisine',        null]);

      // Service soir
      shiftPlan.push([offset, sophie, 'soir', 'salle',          null]);
      shiftPlan.push([offset, ahmed,  'soir', 'cuisine',        null]);
      shiftPlan.push([offset, lucas,  'soir', 'salle',          null]);
      shiftPlan.push([offset, clara,  'soir', 'cuisine',        null]);
      shiftPlan.push([offset, samir,  'soir', 'plonge',         null]);

      // Renfort vendredi soir
      if (dow === 5) {
        shiftPlan.push([offset, elena, 'soir', 'salle',   'Renfort vendredi soir']);
        shiftPlan.push([offset, mehdi, 'soir', 'cuisine', 'Renfort vendredi soir']);
      }
    }

    for (const [offset, userId, shiftType, poste, note] of shiftPlan) {
      const date = dateInDays(offset);
      try {
        await pool.query(
          `INSERT INTO shifts
             (family_id, user_id, date, shift_type, poste, note, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [team, userId, date, shiftType, poste, note, sophie]
        );
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    }
    console.log(`[seed] ${shiftPlan.length} shifts planifiés sur 14 jours (lundi fermé, renfort vendredi)`);

    console.log('');
    console.log('[seed] === Comptes de démonstration ===');
    console.log('  julien.patron@bistrot.fr    / motdepasse123  (patron — admin)');
    console.log('  sophie.manager@bistrot.fr   / motdepasse123  (manager salle)');
    console.log('  ahmed.chef@bistrot.fr       / motdepasse123  (chef cuisine)');
    console.log('  elena.serveuse@bistrot.fr   / motdepasse123  (serveuse)');
    console.log('  lucas.serveur@bistrot.fr    / motdepasse123  (serveur)');
    console.log('  mehdi.commis@bistrot.fr     / motdepasse123  (commis cuisine)');
    console.log('  clara.commis@bistrot.fr     / motdepasse123  (apprentie)');
    console.log('  samir.plonge@bistrot.fr     / motdepasse123  (plongeur)');
    console.log('');
  } catch (err) {
    console.error('[seed] erreur :', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
