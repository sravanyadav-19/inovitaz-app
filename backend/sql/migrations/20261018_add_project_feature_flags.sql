-- Feature flags: let an admin pause purchases and/or downloads per project.
-- Safe to run repeatedly (IF NOT EXISTS). Defaults keep every existing project sellable/downloadable.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS buy_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS download_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN projects.buy_enabled IS 'FALSE = buying is paused; order creation is refused server-side (403).';
COMMENT ON COLUMN projects.download_enabled IS 'FALSE = downloads paused for buyers; order history remains, download endpoint refuses with 403.';
