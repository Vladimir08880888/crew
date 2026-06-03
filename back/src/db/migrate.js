import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function appliedMigrations() {
  const [rows] = await pool.query('SELECT filename FROM _migrations');
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip ${file}`);
      continue;
    }
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrate] apply ${file}`);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const statements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(`[migrate] échec ${file} :`, err.message);
      process.exit(1);
    } finally {
      conn.release();
    }
  }

  console.log('[migrate] terminé');
  await pool.end();
}

run();
