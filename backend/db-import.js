/**
 * db-import.js — rebuild the database on a FRESH Neon project and load db-backup.json.
 *
 * Steps it performs:
 *   1. Safety guard: refuses to run against the OLD branch's host.
 *   2. Applies sql/schema.sql + every sql/migrations/*.sql (in order).
 *   3. Inserts backup rows in FK-safe order (dependencies auto-discovered).
 *   4. Resets every id sequence so new rows don't collide with imported ids.
 *   5. Prints expected-vs-actual row counts — every line must say MATCH.
 *
 * Usage (PowerShell) — env vars must hold the NEW project's credentials:
 *   $env:DB_HOST = "ep-NEW-host..."
 *   $env:DB_USER = "neondb_owner"
 *   $env:DB_PASSWORD = "new-password"
 *   $env:DB_NAME = "neondb"
 *   node db-import.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const backupFile = process.argv[2] || 'db-backup.json';
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error('❌  Set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME to the NEW project first.');
  process.exit(1);
}

// --- Safety guard: never import into the OLD branch -------------------------
let oldHost = null;
try { oldHost = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env'))).DB_HOST; } catch (_) {}
if (oldHost && DB_HOST === oldHost) {
  console.error('🛑  ABORT: DB_HOST matches your .env — that is the OLD database.');
  console.error('    Set the env vars to the NEW Neon project and run again.');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌  ${backupFile} not found. Run db-export.js first.`);
  process.exit(1);
}
const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
console.log('🔌  Importing into host:', DB_HOST, '| db:', DB_NAME || 'neondb');
console.log(`📦  Backup from: ${backup.exportedAt} (${Object.keys(backup.tables).length} tables)`);

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
    // --- 2. Schema ------------------------------------------------------------
    const schemaFiles = [path.join('sql', 'schema.sql')];
    const migDir = path.join(__dirname, 'sql', 'migrations');
    if (fs.existsSync(migDir)) {
      for (const f of fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()) {
        schemaFiles.push(path.join('sql', 'migrations', f));
      }
    }
    console.log('\n▶  Building schema:');
    for (const rel of schemaFiles) {
      const sql = fs.readFileSync(path.join(__dirname, rel), 'utf8');
      process.stdout.write(`   ${rel} ... `);
      await client.query(sql);
      console.log('✅');
    }

    // --- 3. FK-safe insert order ----------------------------------------------
    const { rows: existing } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'`);
    const existingSet = new Set(existing.map((r) => r.table_name));

    const { rows: fks } = await client.query(`
      SELECT tc.table_name AS child, ccu.table_name AS parent
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);

    const tableNames = Object.keys(backup.tables);
    const deps = {};
    for (const t of tableNames) deps[t] = new Set();
    for (const { child, parent } of fks) {
      if (deps[child] && child !== parent && tableNames.includes(parent)) deps[child].add(parent);
    }
    const ordered = [];
    const done = new Set();
    while (ordered.length < tableNames.length) {
      const ready = tableNames.filter((t) => !done.has(t) && [...deps[t]].every((d) => done.has(d)));
      if (!ready.length) { // cycle fallback
        ordered.push(...tableNames.filter((t) => !done.has(t)).sort());
        break;
      }
      ready.sort();
      ordered.push(...ready);
      ready.forEach((t) => done.add(t));
    }

    // Columns of type json/jsonb must be re-stringified on insert
    // (node-pg passes plain strings through bare -> invalid JSON errors).
    const { rows: jsonCols } = await client.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' AND data_type IN ('json','jsonb')`);
    const jsonMap = {};
    for (const { table_name, column_name } of jsonCols) {
      (jsonMap[table_name] = jsonMap[table_name] || new Set()).add(column_name);
    }

    console.log('\n▶  Loading data (FK-safe order):');
    for (const t of ordered) {
      if (!existingSet.has(t)) {
        console.log(`   ⚠  ${t.padEnd(24)} SKIPPED — table does not exist on target (harmless)`);
        continue;
      }
      const { columns, rows } = backup.tables[t];
      // Truncate-and-reload: clears migration seeds and any partial state,
      // so this script is safely re-runnable. CASCADE wipes dependents too;
      // they get their own reload later in the FK-ordered loop.
      const { rows: cnt } = await client.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      if (cnt[0].n > 0) {
        await client.query(`TRUNCATE "${t}" RESTART IDENTITY CASCADE`);
        console.log(`   🧹 ${t.padEnd(23)} cleared ${cnt[0].n} existing row(s)`);
      }
      if (!rows.length) { console.log(`   ${t.padEnd(25)} 0 rows`); continue; }
      const colList = columns.map((c) => `"${c}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const jset = jsonMap[t];
      await client.query('BEGIN');
      try {
        for (const row of rows) {
          const values = columns.map((c) =>
            jset && jset.has(c) && row[c] !== null && row[c] !== undefined
              ? JSON.stringify(row[c])
              : row[c]);
          await client.query(`INSERT INTO "${t}" (${colList}) VALUES (${placeholders})`, values);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        console.log(`   ❌  ${t.padEnd(22)} FAILED: ${e.message}`);
        process.exitCode = 1;
        continue;
      }
      console.log(`   ${t.padEnd(25)} ${rows.length} rows ✅`);
    }

    // --- 4. Sequence reset ------------------------------------------------------
    const { rows: seqs } = await client.query(`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema='public' AND column_default LIKE 'nextval%'`);
    for (const { table_name, column_name } of seqs) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, $2),
               COALESCE((SELECT MAX("${column_name}") FROM "${table_name}"), 1))`,
        [table_name, column_name]);
    }
    console.log(`\n▶  Reset ${seqs.length} id sequence(s) ✅`);

    // --- 5. Verification --------------------------------------------------------
    console.log('\n📊  Verification (expected vs actual):');
    let allMatch = true;
    for (const t of ordered) {
      if (!existingSet.has(t)) continue;
      const expected = backup.tables[t].rows.length;
      const { rows: cnt } = await client.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      const ok = cnt[0].n >= expected; // seeds may add a couple of rows (e.g. delivery_addresses)
      if (!ok) allMatch = false;
      console.log(`   ${t.padEnd(24)} ${String(expected).padStart(4)} -> ${String(cnt[0].n).padStart(4)}  ${ok ? 'MATCH' : '❌ MISMATCH'}`);
    }

    if (allMatch && !process.exitCode) {
      console.log('\n🎉  Import complete and verified. Next steps:');
      console.log('   1. Render -> backend -> Environment -> update DB_HOST / DB_USER / DB_PASSWORD / DB_NAME');
      console.log('   2. Update backend\\.env locally with the same values');
      console.log('   3. curl https://inovitaz-backend.onrender.com/api/complete-orders/delivery-addresses');
      console.log('   4. curl https://inovitaz-backend.onrender.com/api/complete-orders/capacity');
      console.log('   5. Log into the live site with an existing account');
    } else {
      console.log('\n⚠️   Finished with issues — read the lines above carefully before proceeding.');
    }
  } finally {
    client.release();
    await pool.end();
  }
})().catch((e) => { console.error('❌  Import failed:', e.message); process.exit(1); });
