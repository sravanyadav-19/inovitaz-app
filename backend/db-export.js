/**
 * db-export.js — dump EVERY table of the current database to one JSON file.
 *
 * Connects using backend/.env (DB_HOST / DB_USER / DB_PASSWORD / DB_NAME) —
 * which today points at the RICH branch (production-before-phase2).
 * Run in a FRESH PowerShell window (no $env: overrides set).
 *
 * Usage:
 *   node db-export.js                 -> writes db-backup.json
 *   node db-export.js backup-main.json -> custom filename
 *
 * ⚠ The output file contains user data incl. password hashes.
 *   Never commit it. Delete it after the migration is verified.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const outFile = process.argv[2] || 'db-backup.json';
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error('❌  No DB_* settings found. Run from the backend folder (needs .env).');
  process.exit(1);
}

console.log('🔌  Exporting from host:', DB_HOST, '| db:', DB_NAME || 'neondb');

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME || 'neondb',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

(async () => {
  const client = await pool.connect();
  try {
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const backup = { exportedAt: new Date().toISOString(), host: DB_HOST, tables: {} };
    console.log(`\nFound ${tables.length} tables:\n`);

    for (const { table_name } of tables) {
      const result = await client.query(`SELECT * FROM "${table_name}"`);
      backup.tables[table_name] = {
        columns: result.fields.map((f) => f.name),
        rows: result.rows,
      };
      console.log(`  ${table_name.padEnd(24)} ${String(result.rows.length).padStart(4)} rows`);
    }

    fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));
    const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
    console.log(`\n✅  Written: ${outFile} (${kb} KB)`);
    console.log('👉  Open it and eyeball that projects / users / orders data is really there.');
    console.log('👉  Keep this file safe until the new database is verified live.');
  } finally {
    client.release();
    await pool.end();
  }
})().catch((e) => { console.error('❌  Export failed:', e.message); process.exit(1); });
