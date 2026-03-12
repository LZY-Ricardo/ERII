-- ERII Blog - Vercel Postgres schema
-- 手工执行位置（推荐）：Vercel Dashboard -> Storage -> Postgres -> Query

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  cover TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'mdx' CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  content_json JSONB,
  render_body TEXT,
  editor_source TEXT NOT NULL DEFAULT 'internal' CHECK (editor_source IN ('internal', 'notion', 'import')),
  source_ref TEXT,
  source_updated_at TIMESTAMPTZ,
  latest_revision_id BIGINT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS posts_status_date_idx ON posts (status, date DESC);
CREATE INDEX IF NOT EXISTS posts_updated_at_idx ON posts (updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_editor_source_idx ON posts (editor_source, updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_source_ref_idx ON posts (source_ref) WHERE source_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  pathname TEXT NOT NULL,
  content_type TEXT,
  size BIGINT,
  source_provider TEXT CHECK (source_provider IN ('internal', 'notion', 'external')),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assets_created_at_idx ON assets (created_at DESC);
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

-- 评论系统
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_slug TEXT NOT NULL,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_email_hash TEXT NOT NULL,
  author_link TEXT,
  content_raw TEXT NOT NULL,
  content_html TEXT NOT NULL,
  use_markdown BOOLEAN NOT NULL DEFAULT TRUE,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  mail_notice BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'pending', 'spam', 'deleted')),
  edit_token_hash TEXT NOT NULL,
  edit_count INTEGER NOT NULL DEFAULT 0,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS comments_post_slug_status_created_at_idx
  ON comments (post_slug, status, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_parent_id_created_at_idx
  ON comments (parent_id, created_at ASC);
CREATE INDEX IF NOT EXISTS comments_author_email_hash_idx
  ON comments (author_email_hash);

CREATE TABLE IF NOT EXISTS comment_edit_history (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  content_raw TEXT NOT NULL,
  content_html TEXT NOT NULL,
  editor_ip INET,
  editor_user_agent TEXT,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comment_edit_history_comment_id_edited_at_idx
  ON comment_edit_history (comment_id, edited_at DESC);

CREATE TABLE IF NOT EXISTS comment_votes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, fingerprint_hash)
);

CREATE INDEX IF NOT EXISTS comment_votes_comment_id_created_at_idx
  ON comment_votes (comment_id, created_at DESC);
