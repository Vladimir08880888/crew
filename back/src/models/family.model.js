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
    const [rows] = await pool.query(
      `SELECT f.*, fm.role, fm.is_admin, fm.status
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
};
