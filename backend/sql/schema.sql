-- ============================================
-- InovitaZ Database Schema - PostgreSQL
-- ============================================

-- Drop tables if exist (correct order for foreign keys)
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS download_logs CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views if exist
DROP VIEW IF EXISTS project_stats CASCADE;
DROP VIEW IF EXISTS user_purchases CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  -- Password reset (Fix 6)
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  -- Session invalidation: bumping this invalidates all previously-issued JWTs
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Projects Table
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
);

CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_difficulty ON projects(difficulty);
CREATE INDEX idx_projects_rating ON projects(average_rating);
CREATE INDEX idx_projects_price ON projects(price);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Legacy field retained for backwards compatibility. New orders use order_items.
project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  amount INTEGER NOT NULL,
  original_amount INTEGER DEFAULT NULL,
  discount_amount INTEGER DEFAULT 0,
  coupon_code VARCHAR(50) DEFAULT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_project ON orders(project_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_razorpay ON orders(razorpay_order_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_project_status ON orders(project_id, status);

-- Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity = 1),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  original_amount INTEGER NOT NULL CHECK (original_amount >= 0),
  discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount INTEGER NOT NULL CHECK (final_amount >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, project_id),
  CHECK (final_amount = original_amount - discount_amount)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_project ON order_items(project_id);
CREATE INDEX idx_order_items_project_order ON order_items(project_id, order_id);

-- Coupons Table
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
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);

-- Reviews Table
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
);

CREATE INDEX idx_reviews_project ON reviews(project_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_project_rating ON reviews(project_id, rating);

-- Wishlist Table
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_project ON wishlist(project_id);

-- Download Logs Table
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
);

CREATE INDEX idx_download_logs_user_project ON download_logs(user_id, project_id);
CREATE INDEX idx_download_logs_expiry ON download_logs(expiry_date);

-- Coupon Usage Table
CREATE TABLE coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW project_stats AS
WITH sales AS (
  SELECT
    oi.project_id,
    COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid') AS total_sales,
    COALESCE(
      SUM(oi.final_amount) FILTER (WHERE o.status = 'paid'),
      0
    ) AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  GROUP BY oi.project_id
),
wishlist_counts AS (
  SELECT
    project_id,
    COUNT(*) AS wishlist_count
  FROM wishlist
  GROUP BY project_id
)
SELECT
  p.id,
  p.title,
  p.category,
  p.price,
  p.difficulty,
  p.average_rating,
  p.reviews_count,
  COALESCE(s.total_sales, 0) AS total_sales,
  COALESCE(w.wishlist_count, 0) AS wishlist_count,
  COALESCE(s.total_revenue, 0) AS total_revenue
FROM projects p
LEFT JOIN sales s ON s.project_id = p.id
LEFT JOIN wishlist_counts w ON w.project_id = p.id;

CREATE VIEW user_purchases AS
SELECT
  o.id AS order_id,
  o.user_id,
  u.name AS user_name,
  u.email,
  oi.project_id,
  p.title AS project_title,
  p.category,
  p.thumbnail,
  oi.final_amount AS amount,
  oi.original_amount,
  oi.discount_amount,
  o.coupon_code,
  o.status,
  o.created_at AS purchased_at,
  dl.download_count,
  dl.max_downloads,
  (dl.max_downloads - dl.download_count) AS downloads_remaining,
  dl.expiry_date,
  dl.last_downloaded_at
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN users u ON u.id = o.user_id
JOIN projects p ON p.id = oi.project_id
LEFT JOIN download_logs dl
  ON dl.order_id = o.id
  AND dl.project_id = oi.project_id
WHERE o.status = 'paid';

-- ============================================
-- FUNCTIONS (replaces MySQL triggers)
-- ============================================

-- Function to update project rating
CREATE OR REPLACE FUNCTION update_project_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    average_rating = COALESCE(
      (SELECT AVG(rating) FROM reviews WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
      0
    ),
    reviews_count = (
      SELECT COUNT(*) FROM reviews
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after review insert
CREATE TRIGGER trigger_rating_after_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_project_rating();

-- Trigger after review update
CREATE TRIGGER trigger_rating_after_update
AFTER UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_project_rating();

-- Trigger after review delete
CREATE TRIGGER trigger_rating_after_delete
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_project_rating();

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for coupon usage
CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();