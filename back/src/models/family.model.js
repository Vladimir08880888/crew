import { pool } from '../db/pool.js';

export const familyModel = {
  async create({ name, invite_code, created_by }) {
    const [result] = await pool.query(
      'INSERT INTO families (name, invite_code, created_by) VALUES (?, ?, ?)',
      [name, invite_code, created_by]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM families WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByInviteCode(code) {
    const [rows] = await pool.query('SELECT * FROM families WHERE invite_code = ?', [code]);
    return rows[0] || null;
  },

  async listForUser(userId) {
    // pending_count : nombre de demandes en attente pour chaque
    // équipe — utile pour afficher un badge côté manager. Renvoyé
    // pour toutes les équipes mais n'a de sens visuel que sur celles
    // dont fm.role = 'parent'.
    const [rows] = await pool.query(
      `SELECT f.*, fm.role, fm.is_admin, fm.status,
              COALESCE((
                SELECT COUNT(*) FROM family_members
                WHERE family_id = f.id AND status = 'pending'
              ), 0) AS pending_count
       FROM families f
       JOIN family_members fm ON fm.family_id = f.id
       WHERE fm.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async regenerateCode(id, newCode) {
    await pool.query('UPDATE families SET invite_code = ? WHERE id = ?', [newCode, id]);
  },

  async rename(id, name) {
    await pool.query('UPDATE families SET name = ? WHERE id = ?', [name, id]);
  },

  async remove(id) {
    await pool.query('DELETE FROM families WHERE id = ?', [id]);
  },

  async getSettings(id) {
    const [rows] = await pool.query(
      `SELECT junior_coef, confirme_coef, chef_coef, max_couverts,
              midi_cuisine_ideal, midi_salle_ideal,
              soir_cuisine_ideal, soir_salle_ideal,
              closed_days_mask,
              junior_rate, confirme_rate, chef_rate
       FROM families WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async updateSettings(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    await pool.query(`UPDATE families SET ${set} WHERE id = ?`, [...Object.values(fields), id]);
  },
};
