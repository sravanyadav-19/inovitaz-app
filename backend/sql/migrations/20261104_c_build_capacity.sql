-- ============================================================
-- Migration: 20261104_c_build_capacity
-- Admin-adjustable cap on concurrent build orders.
-- site_settings is a generic key/value store (reusable for
-- future knobs). 'build_order_limit' = max concurrent builds
-- (active/paused/ready). 0 = ordering closed.
-- Safe to run multiple times.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (key, value)
VALUES ('build_order_limit', '5')
ON CONFLICT (key) DO NOTHING;
