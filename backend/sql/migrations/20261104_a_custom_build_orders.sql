-- ============================================================
-- Migration: 20261104_a_custom_build_orders
-- order.inovitaz.in — "We build it for you" pipeline.
-- Intake-first: questionnaire -> admin review/quote -> 40% advance
-- (reuses the existing Razorpay orders table + verify/webhook flow).
-- Safe to run multiple times.
-- ============================================================

-- 1. Per-project build pricing, set from the admin panel.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_price INTEGER;

-- 2. Build requests (the intake + job-tracking table).
CREATE TABLE IF NOT EXISTS build_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,

  -- Intake questionnaire (anti-miscommunication contract)
  purpose VARCHAR(100) NOT NULL,
  purpose_other TEXT,
  requirements TEXT NOT NULL,
  deadline DATE NOT NULL,
  components_owned TEXT,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  notes TEXT,

  -- Admin review
  status VARCHAR(30) NOT NULL DEFAULT 'submitted'
    CHECK (status IN (
      'submitted',           -- intake received, awaiting review
      'under_review',        -- admin is clarifying with the buyer
      'quoted',              -- quote sent, awaiting the 40% advance
      'advance_paid',        -- advance captured -> build starts
      'in_progress',         -- actively being built
      'shipped',             -- couriered, tracking shared
      'delivered',           -- in the buyer's hands
      'completed',           -- balance collected, job closed
      'cancelled',
      'rejected'
    )),
  quoted_price INTEGER,            -- total build price in paise
  advance_amount INTEGER,          -- 40% of quoted_price, in paise
  expected_delivery DATE,
  admin_notes TEXT,                -- internal, never shown to the buyer
  clarification_thread JSONB DEFAULT '[]'::jsonb,  -- [{from, message, at}]

  -- Money
  advance_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  balance_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_build_requests_user ON build_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_build_requests_status ON build_requests(status);
CREATE INDEX IF NOT EXISTS idx_build_requests_project ON build_requests(project_id);

COMMENT ON TABLE build_requests IS
  'Custom build pipeline for order.inovitaz.in: intake questionnaire -> admin review -> 40% advance -> build -> ship -> balance.';
