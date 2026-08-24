/*
 * Applies the Phase 2 order_items migration to an existing database
 * without dropping data.
 *
 * Do not run it yet.
 * Later command: npm run migrate:order-items
 */

const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const { pool } = require('../src/config/db');

const migrationId = '20260824_add_order_items';
const migrationPath = path.join(
  __dirname,
  '..',
  'sql',
  'migrations',
  `${migrationId}.sql`
);

const runMigration = async () => {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = await client.query(
      'SELECT id FROM schema_migrations WHERE id = $1',
      [migrationId]
    );

    if (applied.rows.length > 0) {
      console.log(`Migration already applied: ${migrationId}`);
      return;
    }

    const sql = await fs.readFile(migrationPath, 'utf8');

    console.log(`Applying migration: ${migrationId}`);
    await client.query('BEGIN');
    await client.query(sql);

    await client.query(
      'INSERT INTO schema_migrations (id) VALUES ($1)',
      [migrationId]
    );

    await client.query('COMMIT');

    console.log(`Migration applied successfully: ${migrationId}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();