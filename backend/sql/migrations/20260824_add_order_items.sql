-- Phase 2: convert one-project orders into order headers with order_items.
-- Do not run this manually against Neon yet.
-- A later migration runner will execute this inside a transaction.

-- Support older database versions that may not have these payment columns.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Keep legacy project_id for old orders, but allow new multi-project orders.
ALTER TABLE orders ALTER COLUMN project_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS order_items (
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

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_project ON order_items(project_id);
CREATE INDEX IF NOT EXISTS idx_order_items_project_order ON order_items(project_id, order_id);

-- Backfill one item for every existing legacy order.
INSERT INTO order_items (
  order_id,
  project_id,
  quantity,
  unit_price,
  original_amount,
  discount_amount,
  final_amount
)
SELECT
  o.id,
  o.project_id,
  1,
  COALESCE(o.original_amount, o.amount + COALESCE(o.discount_amount, 0), o.amount),
  COALESCE(o.original_amount, o.amount + COALESCE(o.discount_amount, 0), o.amount),
  COALESCE(o.discount_amount, 0),
  o.amount
FROM orders o
WHERE o.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = o.id
  );

-- Rebuild views so revenue and purchases use order items correctly.
DROP VIEW IF EXISTS project_stats CASCADE;
DROP VIEW IF EXISTS user_purchases CASCADE;

CREATE VIEW project_stats AS
WITH sales AS (
  SELECT
    oi.project_id,
    COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid') AS total_sales,
    COALESCE(SUM(oi.final_amount) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  GROUP BY oi.project_id
),
wishlist_counts AS (
  SELECT project_id, COUNT(*) AS wishlist_count
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