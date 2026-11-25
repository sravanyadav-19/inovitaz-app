/**
 * db-probe2.js — replicates src/config/db.js EXACTLY (same fallbacks, same
 * NODE_ENV-conditional SSL), then runs the delivery-addresses query.
 *
 *   node db-probe2.js
 *
 * If THIS fails while db-probe.js succeeded, the difference IS the bug.
 */
require('dotenv').config();
const { Pool } = require('pg');

console.log('NODE_ENV =', JSON.stringify(process.env.NODE_ENV));
console.log('DB_HOST  =', process.env.DB_HOST || '(MISSING -> will fall back to localhost!)');

// EXACT copy of src/config/db.js logic:
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'inovitaz_db',
  connectionTimeoutMillis: 5000,
};
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

console.log('Effective  = host:', poolConfig.host, '| db:', poolConfig.database, '| user:', poolConfig.user, '| ssl:', poolConfig.ssl ? 'ON' : 'OFF', '\n');

const pool = new Pool(poolConfig);
(async () => {
  try {
    const r = await pool.query(
      'SELECT id, label FROM delivery_addresses ORDER BY sort_order, id'
    );
    console.log(`✅  Query OK — ${r.rows.length} row(s):`, JSON.stringify(r.rows));
    console.log('👉  Config is fine; the running server process is the problem.');
  } catch (e) {
    console.log('❌  RAW ERROR:', e.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('👉  NOTE: ssl is OFF because NODE_ENV is not "production".');
      console.log('👉  FIX: add  NODE_ENV=production  to backend/.env, fully kill node, restart.');
    }
  } finally {
    await pool.end();
  }
})();
