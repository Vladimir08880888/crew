import { pool } from '../db/pool.js';

export const userModel = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, first_name, last_name, calendar_token, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByCalendarToken(token) {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE calendar_token = ?',
      [token]
    );
    return rows[0] || null;
  },

  async create({ email, password_hash, first_name, last_name, calendar_token }) {
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, calendar_token)
       VALUES (?, ?, ?, ?, ?)`,
      [email, password_hash, first_name, last_name, calendar_token]
    );
    return result.insertId;
  },

  async updateProfile(id, { first_name, last_name }) {
    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
      [first_name, last_name, id]
    );
  },

  async updatePassword(id, password_hash) {
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
  },
};
