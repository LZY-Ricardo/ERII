CREATE TABLE IF NOT EXISTS post_working_drafts (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  cover TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'mdx' CHECK (content_format IN ('markdown', 'mdx', 'blocks')),
  content_json JSONB,
  render_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_working_drafts_updated_at_idx
  ON post_working_drafts (updated_at DESC);
