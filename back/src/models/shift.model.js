import { pool } from '../db/pool.js';

const SELECT_FIELDS = `
  s.id, s.family_id, s.user_id, s.date,
  s.shift_type, s.start_time, s.end_time, s.poste, s.note,
  s.created_by, s.created_at, s.updated_at,
  u.first_name, u.last_name
`;

export const shiftModel = {
  /**
   * Crée un shift. Lance une erreur si un shift existe déjà pour
   * (user_id, date, shift_type) — contrainte UNIQUE.
   */
  async create(data) {
    const [r] = await pool.query(
      `INSERT INTO shifts
       (family_id, user_id, date, shift_type, start_time, end_time, poste, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.family_id,
        data.user_id,
        data.date,
        data.shift_type,
        data.start_time ?? null,
        data.end_time ?? null,
        data.poste,
        data.note ?? null,
        data.created_by,
      ]
    );
    return r.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${SELECT_FIELDS}
       FROM shifts s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Liste les shifts d'une famille sur une période.
   * Si userId est fourni, restreint aux shifts de cet équipier.
   */
  async listByFamily({ familyId, from, to, userId = null }) {
    const conditions = ['s.family_id = ?', 's.date BETWEEN ? AND ?'];
    const params = [familyId, from, to];
    if (userId) { conditions.push('s.user_id = ?'); params.push(userId); }

    const [rows] = await pool.query(
      `SELECT ${SELECT_FIELDS}
       FROM shifts s
       JOIN users u ON u.id = s.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.date ASC, s.shift_type ASC, u.first_name ASC`,
      params
    );
    return rows;
  },

  /**
   * Liste les prochains shifts d'un utilisateur (toutes familles
   * confondues) pour le widget "Mes prochains services" du dashboard
   * et pour l'export iCal.
   */
  async listUpcomingForUser(userId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT ${SELECT_FIELDS}, f.name AS family_name
       FROM shifts s
       JOIN users u ON u.id = s.user_id
       JOIN families f ON f.id = s.family_id
       WHERE s.user_id = ?
         AND s.date >= CURDATE()
       ORDER BY s.date ASC, s.shift_type ASC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(`UPDATE shifts SET ${set} WHERE id = ?`, [...values, id]);
  },

  async remove(id) {
    await pool.query('DELETE FROM shifts WHERE id = ?', [id]);
  },
};
