// Postgres-backed loot store. Used when DATABASE_URL is set; otherwise the
// in-memory fallback in ../models/lootStore keeps the lab ephemeral.
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loots (
      id     TEXT PRIMARY KEY,
      ts     BIGINT NOT NULL,
      ip     TEXT,
      ua     TEXT,
      stolen BOOLEAN NOT NULL,
      email  TEXT,
      bid    TEXT,
      token  TEXT
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_loots_ts ON loots (ts)');
}

async function addLoot(entry) {
  await pool.query(
    `INSERT INTO loots (id, ts, ip, ua, stolen, email, bid, token)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [entry.id, entry.ts, entry.ip, entry.ua, entry.stolen, entry.email, entry.bid, entry.token]
  );
  return entry;
}

async function recentLoots(limit = 50) {
  const { rows } = await pool.query('SELECT * FROM loots ORDER BY ts DESC LIMIT $1', [limit]);
  // pg returns BIGINT as a string; the dashboard treats ts as a JS number.
  return rows.map(r => ({ ...r, ts: Number(r.ts) }));
}

async function clearLoots() {
  await pool.query('DELETE FROM loots');
}

async function lootCounters() {
  const { rows } = await pool.query(`
    SELECT COUNT(*)::int AS executions,
           COUNT(*) FILTER (WHERE stolen)::int AS stolen,
           COUNT(*) FILTER (WHERE NOT stolen)::int AS empty
    FROM loots
  `);
  return rows[0];
}

async function close() {
  await pool.end();
}

module.exports = { ensureSchema, addLoot, recentLoots, clearLoots, lootCounters, close };
