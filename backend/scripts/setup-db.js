/**
 * InovitaZ Database Setup Script
 * PostgreSQL - Schema embedded directly (no file reading)
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'inovitaz_db',
});

const setupDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('Connected to PostgreSQL:', process.env.DB_NAME);

    // ============================================
    // DROP EXISTING TABLES
    // ============================================
    console.log('Dropping old tables...');

    await client.query(`DROP TABLE IF EXISTS coupon_usage CASCADE`);
    await client.query(`DROP TABLE IF EXISTS download_logs CASCADE`);
    await client.query(`DROP TABLE IF EXISTS wishlist CASCADE`);
    await client.query(`DROP TABLE IF EXISTS reviews CASCADE`);
    await client.query(`DROP TABLE IF EXISTS orders CASCADE`);
    await client.query(`DROP TABLE IF EXISTS coupons CASCADE`);
    await client.query(`DROP TABLE IF EXISTS projects CASCADE`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE`);
    await client.query(`DROP VIEW IF EXISTS project_stats CASCADE`);
    await client.query(`DROP VIEW IF EXISTS user_purchases CASCADE`);
    await client.query(`DROP FUNCTION IF EXISTS update_project_rating CASCADE`);
    await client.query(`DROP FUNCTION IF EXISTS increment_coupon_usage CASCADE`);

    console.log('Old tables dropped');

    // ============================================
    // CREATE TABLES
    // ============================================
    console.log('Creating tables...');

    // Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX idx_users_role ON users(role)`);
    console.log('  users table created');

    // Projects
    await client.query(`
      CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL DEFAULT 49900,
        thumbnail VARCHAR(512),
        content_url VARCHAR(1024),
        category VARCHAR(100) DEFAULT 'IoT',
        difficulty VARCHAR(50) DEFAULT 'Beginner'
          CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        reviews_count INTEGER DEFAULT 0,
        features JSONB,
        tech_stack JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX idx_projects_category ON projects(category)`);
    await client.query(`CREATE INDEX idx_projects_difficulty ON projects(difficulty)`);
    await client.query(`CREATE INDEX idx_projects_rating ON projects(average_rating)`);
    await client.query(`CREATE INDEX idx_projects_price ON projects(price)`);
    console.log('  projects table created');

    // Orders
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        amount INTEGER NOT NULL,
        original_amount INTEGER DEFAULT NULL,
        discount_amount INTEGER DEFAULT 0,
        coupon_code VARCHAR(50) DEFAULT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'created'
          CHECK (status IN ('created', 'paid', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX idx_orders_user ON orders(user_id)`);
    await client.query(`CREATE INDEX idx_orders_project ON orders(project_id)`);
    await client.query(`CREATE INDEX idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX idx_orders_razorpay ON orders(razorpay_order_id)`);
    await client.query(`CREATE INDEX idx_orders_user_status ON orders(user_id, status)`);
    console.log('  orders table created');

    // Coupons
    await client.query(`
      CREATE TABLE coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255),
        discount_type VARCHAR(20) NOT NULL
          CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        min_purchase_amount INTEGER DEFAULT 0,
        max_discount_amount INTEGER DEFAULT NULL,
        usage_limit INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX idx_coupons_code ON coupons(code)`);
    await client.query(`CREATE INDEX idx_coupons_active ON coupons(is_active)`);
    console.log('  coupons table created');

    // Reviews
    await client.query(`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      )
    `);
    await client.query(`CREATE INDEX idx_reviews_project ON reviews(project_id)`);
    await client.query(`CREATE INDEX idx_reviews_rating ON reviews(rating)`);
    console.log('  reviews table created');

    // Wishlist
    await client.query(`
      CREATE TABLE wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      )
    `);
    await client.query(`CREATE INDEX idx_wishlist_user ON wishlist(user_id)`);
    console.log('  wishlist table created');

    // Download Logs
    await client.query(`
      CREATE TABLE download_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        download_count INTEGER DEFAULT 0,
        max_downloads INTEGER DEFAULT 5,
        expiry_date TIMESTAMP NOT NULL,
        last_downloaded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id, order_id)
      )
    `);
    await client.query(`CREATE INDEX idx_download_logs_expiry ON download_logs(expiry_date)`);
    console.log('  download_logs table created');

    // Coupon Usage
    await client.query(`
      CREATE TABLE coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        discount_amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id)`);
    console.log('  coupon_usage table created');

    // ============================================
    // VIEWS
    // ============================================
    console.log('Creating views...');

    await client.query(`
      CREATE VIEW project_stats AS
      SELECT
        p.id,
        p.title,
        p.category,
        p.price,
        p.difficulty,
        p.average_rating,
        p.reviews_count,
        COUNT(DISTINCT o.id) as total_sales,
        COUNT(DISTINCT w.id) as wishlist_count,
        COALESCE(
          SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END),
          0
        ) as total_revenue
      FROM projects p
      LEFT JOIN orders o ON p.id = o.project_id
      LEFT JOIN wishlist w ON p.id = w.project_id
      GROUP BY p.id
    `);

    await client.query(`
      CREATE VIEW user_purchases AS
      SELECT
        o.id as order_id,
        o.user_id,
        u.name as user_name,
        u.email,
        o.project_id,
        p.title as project_title,
        p.category,
        p.thumbnail,
        o.amount,
        o.original_amount,
        o.discount_amount,
        o.coupon_code,
        o.status,
        o.created_at as purchased_at,
        dl.download_count,
        dl.max_downloads,
        (dl.max_downloads - dl.download_count) as downloads_remaining,
        dl.expiry_date,
        dl.last_downloaded_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN projects p ON o.project_id = p.id
      LEFT JOIN download_logs dl ON o.id = dl.order_id
      WHERE o.status = 'paid'
    `);
    console.log('Views created');

    // ============================================
    // TRIGGERS
    // ============================================
    console.log('Creating triggers...');

    await client.query(`
      CREATE OR REPLACE FUNCTION update_project_rating()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE projects
        SET
          average_rating = COALESCE(
            (SELECT AVG(rating)
             FROM reviews
             WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
            0
          ),
          reviews_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = COALESCE(NEW.project_id, OLD.project_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      CREATE TRIGGER trigger_rating_after_insert
      AFTER INSERT ON reviews
      FOR EACH ROW EXECUTE FUNCTION update_project_rating()
    `);

    await client.query(`
      CREATE TRIGGER trigger_rating_after_update
      AFTER UPDATE ON reviews
      FOR EACH ROW EXECUTE FUNCTION update_project_rating()
    `);

    await client.query(`
      CREATE TRIGGER trigger_rating_after_delete
      AFTER DELETE ON reviews
      FOR EACH ROW EXECUTE FUNCTION update_project_rating()
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION increment_coupon_usage()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE coupons
        SET used_count = used_count + 1
        WHERE id = NEW.coupon_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query(`
      CREATE TRIGGER trigger_increment_coupon_usage
      AFTER INSERT ON coupon_usage
      FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage()
    `);

    console.log('Triggers created');

    // ============================================
    // SEED DATA — MINIMAL (1 project for testing)
    // ============================================
    console.log('Inserting seed data...');

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await client.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['admin@inovitaz.com', adminPassword, 'Admin User']
    );
    console.log('  Admin user created');

    // ONE test project
    await client.query(
      `INSERT INTO projects
         (title, description, price, category,
          difficulty, thumbnail, features, tech_stack)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Line Following Robot',
        JSON.stringify({
          overview: 'Test project to verify frontend-backend connection.',
          components: 'Arduino Uno\nIR Sensors x5\nL293D Motor Driver\nDC Motors x2\nChassis',
          circuitText: 'IR sensors to pins 2-6. Motor driver to pins 8-11.',
          steps: '1. Assemble\n2. Upload code\n3. Test on track',
          download_url: 'https://example.com/test-file'
        }),
        29900,
        'Robotics',
        'Beginner',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
        JSON.stringify(['IR Sensors', 'Motor Control', 'PID Logic']),
        JSON.stringify(['Arduino', 'C++'])
      ]
    );
    console.log('  1 test project inserted');

    // ONE test coupon
    await client.query(
      `INSERT INTO coupons
         (code, description, discount_type,
          discount_value, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
       ON CONFLICT (code) DO NOTHING`,
      ['TEST10', 'Test coupon 10% off', 'percentage', 10.00, 10]
    );
    console.log('  1 test coupon inserted');

    // ============================================
    // DONE
    // ============================================
    console.log('\n================================');
    console.log('Database setup complete!');
    console.log('================================');
    console.log('Admin  : admin@inovitaz.com');
    console.log('Pass   : admin123');
    console.log('================================\n');

  } catch (error) {
    console.error('Setup failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
};

setupDatabase();