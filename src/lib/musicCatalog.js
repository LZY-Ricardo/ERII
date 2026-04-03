import { db } from "./db.js";
import { getAllPlaylists, getMusicDockPlaylists, getPlaylistUrl } from "./music.js";

const MUSIC_PLAYER_DEFAULT = true;
const SUPPORTED_PLATFORMS = new Set(["spotify", "qq", "netease"]);

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function parseInteger(value, fallback = 0) {
  const next = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(next) ? next : fallback;
}

function slugifyPlaylistId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildMusicEntryId({ platform, playlistId }) {
  const safePlatform = String(platform ?? "").trim().toLowerCase();
  const safePlaylistId = slugifyPlaylistId(playlistId);
  if (!safePlatform || !safePlaylistId) {
    return "";
  }
  return `${safePlatform}:${safePlaylistId}`;
}

export function normalizeMusicPlaylistRow(row) {
  if (!row) return null;

  const playlist = {
    entryId: row.entry_id ?? row.id ?? "",
    id: row.playlist_id ?? row.id ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    platform: row.platform ?? "spotify",
    coverUrl: row.cover_url ?? "",
    playlistUrl: row.playlist_url ?? "",
    isPublished: parseBoolean(row.is_published, true),
    allowEmbeddedPlayer: parseBoolean(row.allow_embedded_player, false),
    sortOrder: parseInteger(row.sort_order, 0),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };

  if (!playlist.playlistUrl) {
    playlist.playlistUrl = getPlaylistUrl(playlist);
  }

  return playlist;
}

function normalizeStaticPlaylist(playlist, index = 0) {
  return {
    entryId: buildMusicEntryId({
      platform: playlist.platform,
      playlistId: playlist.id,
    }),
    id: playlist.id,
    name: playlist.name ?? "",
    description: playlist.description ?? "",
    platform: playlist.platform ?? "spotify",
    coverUrl: playlist.coverUrl ?? "",
    playlistUrl: getPlaylistUrl(playlist),
    isPublished: true,
    allowEmbeddedPlayer: playlist.platform === "spotify",
    sortOrder: index + 1,
    createdAt: null,
    updatedAt: null,
  };
}

export function normalizeMusicPlaylistInput(input = {}) {
  const platform = String(input.platform ?? "spotify").trim().toLowerCase();
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error("仅支持 Spotify、QQ 音乐和网易云音乐。");
  }

  const name = String(input.name ?? "").trim();
  const playlistId = String(input.playlistId ?? input.id ?? "").trim();
  const description = String(input.description ?? "").trim();
  const coverUrl = String(input.coverUrl ?? "").trim();
  const sortOrder = parseInteger(input.sortOrder, 0);
  const isPublished = parseBoolean(input.isPublished, true);
  const allowEmbeddedPlayer = platform === "spotify" && parseBoolean(input.allowEmbeddedPlayer, false);
  const playlistUrl = String(input.playlistUrl ?? "").trim();

  if (!name) {
    throw new Error("歌单名称不能为空。");
  }

  if (!playlistId) {
    throw new Error("歌单 ID 不能为空。");
  }

  const normalized = {
    entryId: buildMusicEntryId({ platform, playlistId }),
    id: playlistId,
    name,
    description,
    platform,
    coverUrl,
    playlistUrl,
    isPublished,
    allowEmbeddedPlayer,
    sortOrder,
  };

  normalized.playlistUrl = normalized.playlistUrl || getPlaylistUrl(normalized);
  return normalized;
}

async function getMusicPlayerEnabledFromDb(dbInstance) {
  const result = await dbInstance.sql`
    SELECT value
    FROM admin_meta
    WHERE key = 'site_settings'
  `;

  if (!result.rows?.[0]?.value) {
    return MUSIC_PLAYER_DEFAULT;
  }

  try {
    const settings = JSON.parse(result.rows[0].value);
    return parseBoolean(settings?.musicPlayerEnabled, MUSIC_PLAYER_DEFAULT);
  } catch {
    return MUSIC_PLAYER_DEFAULT;
  }
}

async function fetchMusicPlaylistsFromDb({
  publishedOnly = false,
  embeddableOnly = false,
} = {}) {
  if (!db) {
    throw new Error("Database is not configured.");
  }

  let result;

  if (publishedOnly && embeddableOnly) {
    result = await db.sql`
      SELECT
        id AS entry_id,
        name,
        description,
        platform,
        playlist_id,
        playlist_url,
        cover_url,
        is_published,
        allow_embedded_player,
        sort_order,
        created_at,
        updated_at
      FROM music_playlists
      WHERE is_published = true
        AND platform = 'spotify'
        AND allow_embedded_player = true
      ORDER BY sort_order ASC, created_at ASC
    `;
  } else if (publishedOnly) {
    result = await db.sql`
      SELECT
        id AS entry_id,
        name,
        description,
        platform,
        playlist_id,
        playlist_url,
        cover_url,
        is_published,
        allow_embedded_player,
        sort_order,
        created_at,
        updated_at
      FROM music_playlists
      WHERE is_published = true
      ORDER BY sort_order ASC, created_at ASC
    `;
  } else if (embeddableOnly) {
    result = await db.sql`
      SELECT
        id AS entry_id,
        name,
        description,
        platform,
        playlist_id,
        playlist_url,
        cover_url,
        is_published,
        allow_embedded_player,
        sort_order,
        created_at,
        updated_at
      FROM music_playlists
      WHERE platform = 'spotify'
        AND allow_embedded_player = true
      ORDER BY sort_order ASC, created_at ASC
    `;
  } else {
    result = await db.sql`
      SELECT
        id AS entry_id,
        name,
        description,
        platform,
        playlist_id,
        playlist_url,
        cover_url,
        is_published,
        allow_embedded_player,
        sort_order,
        created_at,
        updated_at
      FROM music_playlists
      ORDER BY sort_order ASC, created_at ASC
    `;
  }

  return result.rows.map(normalizeMusicPlaylistRow).filter(Boolean);
}

function getStaticPublishedPlaylists() {
  return getAllPlaylists().map(normalizeStaticPlaylist).filter((playlist) => playlist.isPublished);
}

export async function getAdminMusicPlaylists() {
  if (!db) {
    return getStaticPublishedPlaylists();
  }

  const rows = await fetchMusicPlaylistsFromDb();
  return rows;
}

export async function getPublishedMusicPlaylists() {
  try {
    if (!db) {
      return getStaticPublishedPlaylists();
    }

    return await fetchMusicPlaylistsFromDb({ publishedOnly: true });
  } catch (error) {
    console.error("[musicCatalog] fallback to static published playlists:", error);
    return getStaticPublishedPlaylists();
  }
}

export async function getEmbeddableSpotifyPlaylists() {
  try {
    if (!db) {
      return getMusicDockPlaylists({ playlists: getStaticPublishedPlaylists(), limit: 3 });
    }

    return await fetchMusicPlaylistsFromDb({
      publishedOnly: true,
      embeddableOnly: true,
    });
  } catch (error) {
    console.error("[musicCatalog] fallback to static Spotify playlists:", error);
    return getMusicDockPlaylists({ playlists: getStaticPublishedPlaylists(), limit: 3 });
  }
}

export async function getMusicPlayerEnabled() {
  try {
    if (!db) {
      return MUSIC_PLAYER_DEFAULT;
    }

    return await getMusicPlayerEnabledFromDb(db);
  } catch (error) {
    console.error("[musicCatalog] fallback to default music player setting:", error);
    return MUSIC_PLAYER_DEFAULT;
  }
}

export async function getPublicMusicCatalog() {
  const [playlists, musicPlayerEnabled] = await Promise.all([
    getPublishedMusicPlaylists(),
    getMusicPlayerEnabled(),
  ]);

  return { playlists, musicPlayerEnabled };
}
