/**
 * run-order-migrations.js — one-shot migrator for the order portal.
 *
 * WHY THIS EXISTS: Neon has multiple branches, and migrations kept landing
 * on the wrong one. This script connects with the SAME settings the live
 * Render backend uses (DB_HOST / DB_USER / DB_PASSWORD / DB_NAME — exactly
 * like src/config/db.js) — so whatever it creates is EXACTLY what the
 * backend sees. No branch guessing.
 *
 * HOW TO RUN (PowerShell):
 *   1. Render dashboard -> inovitaz-backend -> Environment -> copy the
 *      values of DB_HOST, DB_USER, DB_PASSWORD (DB_NAME = neondb)
 *   2. cd C:\Users\srava\inovitaz-app\backend
 *   3. Paste these four lines with RENDER's values:
 *        $env:DB_HOST = "ep-XXXX.ap-southeast-1.aws.neon.tech"
 *        $env:DB_USER = "neondb_owner"
 *        $env:DB_PASSWORD = "paste-render-db-password"
 *        $env:DB_NAME = "neondb"
 *   4. node run-order-migrations.js
 *   5. Scoreboard must print 1/1/1/1/1 + the two addresses.
 *
 * Safe to run multiple times (all statements are idempotent).
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error('❌  Set DB_HOST, DB_USER, DB_PASSWORD first — paste the values from Render.');
  process.exit(1);
}

// Show WHERE we are connecting — the ep-XXXX host IS the branch identity.
console.log('🔌  Connecting to host:', DB_HOST, '| db:', DB_NAME || 'neondb', '| user:', DB_USER);

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME || 'neondb',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const MIGRATIONS = [
  '20261104_a_custom_build_orders.sql',
  '20261104_b_complete_build_orders.sql',
  '20261104_c_build_capacity.sql',
];

(async () => {
  const client = await pool.connect();
  try {
    for (const file of MIGRATIONS) {
      const sql = fs.readFileSync(path.join(__dirname, 'sql', 'migrations', file), 'utf8');
      console.log(`\n▶  Running ${file} ...`);
      await client.query(sql);
      console.log(`✅  ${file} done`);
    }

    console.log('\n📊  Scoreboard (expect 1 / 1 / 1 / 1 / 1):');
    const board = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='build_requests')     AS build_requests,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='delivery_addresses') AS delivery_addresses,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='complete_orders')    AS complete_orders,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='order_installments') AS order_installments,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='site_settings')      AS site_settings
    `);
    console.table(board.rows[0]);

    const addr = await client.query('SELECT id, label, is_active FROM delivery_addresses ORDER BY id');
    console.log('📍  delivery_addresses:', JSON.stringify(addr.rows));

    const settings = await client.query('SELECT key, value, updated_at FROM site_settings');
    console.log('⚙️   site_settings:', JSON.stringify(settings.rows));

    console.log('\n🎉  Done. Now verify through the LIVE backend:');
    console.log('    curl https://inovitaz-backend.onrender.com/api/complete-orders/delivery-addresses');
    console.log('    curl https://inovitaz-backend.onrender.com/api/complete-orders/capacity');
  } catch (err) {
    console.error('\n❌  Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
