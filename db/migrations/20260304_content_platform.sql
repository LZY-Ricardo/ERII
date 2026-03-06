-- ERII Blog content platform migration
-- Safe to re-run. Apply in Vercel Postgres or Neon SQL console.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'mdx'
    CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  ADD COLUMN IF NOT EXISTS content_json JSONB,
  ADD COLUMN IF NOT EXISTS render_body TEXT,
  ADD COLUMN IF NOT EXISTS editor_source TEXT NOT NULL DEFAULT 'internal'
    CHECK (editor_source IN ('internal', 'notion', 'import')),
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS latest_revision_id BIGINT;

UPDATE posts
SET render_body = content
WHERE render_body IS NULL;

CREATE INDEX IF NOT EXISTS posts_editor_source_idx ON posts (editor_source, updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_source_ref_idx ON posts (source_ref) WHERE source_ref IS NOT NULL;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS source_provider TEXT
    CHECK (source_provider IN ('internal', 'notion', 'external')),
  ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE INDEX IF NOT EXISTS assets_source_provider_idx ON assets (source_provider, created_at DESC);

CREATE TABLE IF NOT EXISTS post_revisions (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  revision_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  content_format TEXT NOT NULL CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  content_text TEXT,
  content_json JSONB,
  render_body TEXT,
  title TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, revision_no)
);

CREATE INDEX IF NOT EXISTS post_revisions_post_id_created_at_idx
  ON post_revisions (post_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_sync_jobs (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('notion')),
  source_ref TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  payload JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_sync_jobs_status_created_at_idx
  ON content_sync_jobs (status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'posts_latest_revision_fk'
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_latest_revision_fk
      FOREIGN KEY (latest_revision_id) REFERENCES post_revisions(id) ON DELETE SET NULL;
  END IF;
END $$;

