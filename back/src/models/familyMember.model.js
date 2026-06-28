import { pool } from '../db/pool.js';

export const familyMemberModel = {
  async add({ family_id, user_id, role = 'equipier', is_admin = false, status = 'pending' }) {
    await pool.query(
      `INSERT INTO family_members (family_id, user_id, role, is_admin, status)
       VALUES (?, ?, ?, ?, ?)`,
      [family_id, user_id, role, is_admin, status]
    );
  },

  async findByFamilyAndUser(family_id, user_id) {
    const [rows] = await pool.query(
      'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
      [family_id, user_id]
    );
    return rows[0] || null;
  },

  async listByFamily(family_id) {
    const [rows] = await pool.query(
      `SELECT fm.*, u.first_name, u.last_name, u.email
       FROM family_members fm
       JOIN users u ON u.id = fm.user_id
       WHERE fm.family_id = ?
       ORDER BY fm.is_admin DESC, fm.role, u.first_name`,
      [family_id]
    );
    return rows;
  },

  async update(family_id, user_id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(
      `UPDATE family_members SET ${set} WHERE family_id = ? AND user_id = ?`,
      [...values, family_id, user_id]
    );
  },

  async remove(family_id, user_id) {
    await pool.query(
      'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
      [family_id, user_id]
    );
  },

  async countAdmins(family_id) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS c FROM family_members
       WHERE family_id = ? AND is_admin = TRUE AND status = 'active'`,
      [family_id]
    );
    return rows[0].c;
  },
};
