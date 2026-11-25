-- ============================================================
-- Migration: 20261104_b_complete_build_orders
-- order.inovitaz.in v2 — complete-build orders with 3-installment
-- payment plan (40/30/30), VIT-AP delivery, 25-day deadline.
-- Safe to run multiple times.
-- ============================================================

-- 1. Two prices per project: complete build vs DIY bundle.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS build_price INTEGER;

-- 2. Delivery addresses — seeded with VIT-AP as the only active option.
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id SERIAL PRIMARY KEY,
  label VARCHAR(200) NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- Unique label guard: makes the seed INSERTs below genuinely idempotent
-- (ON CONFLICT needs a unique index to conflict against).
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_addresses_label ON delivery_addresses(label);

INSERT INTO delivery_addresses (label, line1, line2, city, state, pincode, is_active, sort_order)
VALUES (
  'VIT-AP University',
  'VIT-AP University, Beside AP Secretariat',
  'Near Vijayawada',
  'Amaravati',
  'Andhra Pradesh',
  '522237',
  TRUE,
  1
)
ON CONFLICT DO NOTHING;

INSERT INTO delivery_addresses (label, line1, city, state, pincode, is_active, sort_order)
VALUES (
  'Local / Private Delivery',
  'Delivered to your home or hostel address',
  '—',
  '—',
  '—',
  FALSE,
  2
)
ON CONFLICT DO NOTHING;

-- 3. Complete-build orders (the 40/30/30 pipeline).
CREATE TABLE IF NOT EXISTS complete_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,

  -- Buyer contact (snapshot at order time)
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,

  -- Delivery
  delivery_address_id INTEGER NOT NULL REFERENCES delivery_addresses(id),
  delivery_room VARCHAR(100),           -- hostel block / room / "who collects"

  -- Money (paise, snapshotted at order time so admin edits never rewrite history)
  total_amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  -- 25-day deadline, set at order time
  deadline DATE NOT NULL,

  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN (
      'active',        -- between payments, build underway or pending
      'paused',        -- an installment is overdue -> work paused
      'ready',         -- build finished, final 30% due -> triggers completion invoice
      'completed',     -- all installments paid + handed over
      'cancelled'
    )),

  notes TEXT,
  admin_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complete_orders_user ON complete_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_complete_orders_status ON complete_orders(status);
CREATE INDEX IF NOT EXISTS idx_complete_orders_project ON complete_orders(project_id);

-- 4. Installments — exactly 3 rows per order, created atomically with it.
CREATE TABLE IF NOT EXISTS order_installments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES complete_orders(id) ON DELETE CASCADE,
  installment_number SMALLINT NOT NULL CHECK (installment_number IN (1, 2, 3)),
  label VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'due'
    CHECK (status IN ('due', 'paid', 'overdue', 'waived')),

  -- Link to the Razorpay order that paid this installment
  razorpay_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (order_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_installments_order ON order_installments(order_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON order_installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due ON order_installments(due_date);

COMMENT ON TABLE order_installments IS
  '40/30/30 payment schedule per complete-build order. #1 = at order, #2 = +7 days, #3 = on completion.';
