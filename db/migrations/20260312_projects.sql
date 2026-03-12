-- ERII Blog projects table migration
-- Create projects table to store project data from static projects.js

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  summary TEXT,
  status TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'building', 'research')),
  focus TEXT[] NOT NULL DEFAULT '{}'::text[],
  tech TEXT[] NOT NULL DEFAULT '{}'::text[],
  cover TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS projects_featured_idx ON projects (featured, sort_order);
CREATE INDEX IF NOT EXISTS projects_state_idx ON projects (state, sort_order);
CREATE INDEX IF NOT EXISTS projects_focus_idx ON projects USING GIN (focus);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS projects_updated_at_trigger ON projects;
CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();
