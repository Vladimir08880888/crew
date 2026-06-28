import { pool } from '../db/pool.js';

export const teamMemberModel = {
  async add({ team_id, user_id, role = 'equipier', is_admin = false, status = 'pending' }) {
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role, is_admin, status)
       VALUES (?, ?, ?, ?, ?)`,
      [team_id, user_id, role, is_admin, status]
    );
  },

  async findByTeamAndUser(team_id, user_id) {
    const [rows] = await pool.query(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
      [team_id, user_id]
    );
    return rows[0] || null;
  },

  async listByTeam(team_id) {
    const [rows] = await pool.query(
      `SELECT fm.*, u.first_name, u.last_name, u.email
       FROM team_members fm
       JOIN users u ON u.id = fm.user_id
       WHERE fm.team_id = ?
       ORDER BY fm.is_admin DESC, fm.role, u.first_name`,
      [team_id]
    );
    return rows;
  },

  async update(team_id, user_id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return;
    const set = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await pool.query(
      `UPDATE team_members SET ${set} WHERE team_id = ? AND user_id = ?`,
      [...values, team_id, user_id]
    );
  },

  async remove(team_id, user_id) {
    await pool.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [team_id, user_id]
    );
  },

  async countAdmins(team_id) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS c FROM team_members
       WHERE team_id = ? AND is_admin = TRUE AND status = 'active'`,
      [team_id]
    );
    return rows[0].c;
  },
};
