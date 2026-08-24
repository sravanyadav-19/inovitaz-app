/*
 * Development-only database reset and seed script.
 *
 * This runs backend/sql/schema.sql, which intentionally drops all tables.
 *
 * Never run this against Neon production.
 * For an existing database migration, use:
 * npm run migrate:order-items
 */

const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');

require('dotenv').config();

const { pool } = require('../src/config/db');

const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

const setupDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log(`Connected to PostgreSQL: ${process.env.DB_NAME || 'inovitaz_db'}`);
    console.log('Resetting local development database from sql/schema.sql...');

    const schema = await fs.readFile(schemaPath, 'utf8');

    // schema.sql is destructive and for local development only.
    await client.query(schema);

    console.log('Schema created. Inserting development seed data...');

    const adminPassword = await bcrypt.hash('admin123', 12);

    await client.query(
      `INSERT INTO users (email, password, name, role, is_verified)
       VALUES ($1, $2, $3, 'admin', TRUE)`,
      ['admin@inovitaz.com', adminPassword, 'Admin User']
    );

    await client.query(
      `INSERT INTO projects
        (title, description, price, category, difficulty, thumbnail, features, tech_stack)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Line Following Robot',
        JSON.stringify({
          overview: 'Test project to verify frontend-backend connection.',
          components: 'Arduino Uno\nIR Sensors x5\nL293D Motor Driver\nDC Motors x2\nChassis',
          circuitText: 'IR sensors to pins 2-6. Motor driver to pins 8-11.',
          steps: '1. Assemble\n2. Upload code\n3. Test on track',
          download_url: 'https://example.com/test-file',
        }),
        29900,
        'Robotics',
        'Beginner',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
        JSON.stringify(['IR Sensors', 'Motor Control', 'PID Logic']),
        JSON.stringify(['Arduino', 'C++']),
      ]
    );

    await client.query(
      `INSERT INTO coupons
        (code, description, discount_type, discount_value, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')`,
      ['TEST10', 'Test coupon 10% off', 'percentage', 10, 10]
    );

    console.log('\n================================');
    console.log('Development database setup complete');
    console.log('Admin: admin@inovitaz.com');
    console.log('Password: admin123');
    console.log('================================\n');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

setupDatabase();