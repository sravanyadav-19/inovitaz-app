-- Project status: a single column replaces the earlier buy_enabled/download_enabled flags.
-- Values: 'active' (everything open) | 'maintenance' (sales paused, owners keep downloads) | 'closed' (both paused).
-- Safe to run repeatedly. Backfills from legacy boolean flags if that migration ran, then drops them.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_status_check') THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_status_check
      CHECK (status IN ('active', 'maintenance', 'closed'));
  END IF;
END $$;

-- Backfill + retire the legacy flags, if they exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'buy_enabled'
  ) THEN
    UPDATE projects
      SET status = CASE
        WHEN buy_enabled = FALSE AND download_enabled = FALSE THEN 'closed'
        WHEN buy_enabled = FALSE THEN 'maintenance'
        ELSE 'active'
      END;
    ALTER TABLE projects DROP COLUMN buy_enabled;
    ALTER TABLE projects DROP COLUMN download_enabled;
  END IF;
END $$;

COMMENT ON COLUMN projects.status IS 'active | maintenance (buyers: 403 closed-for-maintenance, downloads open) | closed (buyers AND downloads: 403).';
