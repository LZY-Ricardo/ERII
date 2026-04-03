-- ERII Blog music playlists migration

CREATE TABLE IF NOT EXISTS music_playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'qq', 'netease')),
  playlist_id TEXT NOT NULL,
  playlist_url TEXT,
  cover_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  allow_embedded_player BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS music_playlists_published_idx
  ON music_playlists (is_published, sort_order);

CREATE INDEX IF NOT EXISTS music_playlists_embeddable_idx
  ON music_playlists (platform, allow_embedded_player, sort_order);

CREATE OR REPLACE FUNCTION update_music_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS music_playlists_updated_at_trigger ON music_playlists;
CREATE TRIGGER music_playlists_updated_at_trigger
  BEFORE UPDATE ON music_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_music_playlists_updated_at();
