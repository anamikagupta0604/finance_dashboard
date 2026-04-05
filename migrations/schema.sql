-- ============================================================
-- Finance Dashboard — Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum types ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role   AS ENUM ('admin', 'analyst', 'viewer');
  CREATE TYPE user_status AS ENUM ('active', 'inactive');
  CREATE TYPE tx_type     AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash TEXT          NOT NULL,
  role          user_role     NOT NULL DEFAULT 'viewer',
  status        user_status   NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ── Transactions ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  type        tx_type       NOT NULL,
  category    VARCHAR(80)   NOT NULL,
  date        DATE          NOT NULL,
  notes       TEXT,
  created_by  UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by  UUID          REFERENCES users(id) ON DELETE SET NULL,
  deleted_at  TIMESTAMPTZ,                         -- soft delete
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_type       ON transactions(type)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_category   ON transactions(category)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_date       ON transactions(date DESC)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tx_created_by ON transactions(created_by) WHERE deleted_at IS NULL;

-- ── Auto-update updated_at ───────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at        ON users;
DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
