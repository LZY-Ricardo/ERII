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
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS posts_status_date_idx ON posts (status, date DESC);
CREATE INDEX IF NOT EXISTS posts_updated_at_idx ON posts (updated_at DESC);

CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  pathname TEXT NOT NULL,
  content_type TEXT,
  size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assets_created_at_idx ON assets (created_at DESC);

