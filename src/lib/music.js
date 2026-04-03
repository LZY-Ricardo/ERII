/**
 * 音乐歌单配置
 *
 * 当前站内播放器仅使用 Spotify 歌单
 */

export const MUSIC_PLAYLISTS = [
  {
    id: "7GJbaMo5ptfJFFZXWNH6fQ",
    name: "新海誠電影主题曲",
    description: "精选音乐合集",
    platform: "spotify",
    coverUrl: "https://i.scdn.co/image/ab67616d00001e02bfc76fbf58c8ef0d2267aeed",
  },
];

/**
 * 平台配置
 */
export const PLATFORM_CONFIG = {
  spotify: {
    name: "Spotify",
    color: "#1DB954",
    icon: `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M208.979592 1024h606.040816c115.461224 0 208.979592-93.518367 208.979592-208.979592V208.979592C1024 93.518367 930.481633 0 815.020408 0H208.979592C93.518367 0 0 93.518367 0 208.979592v606.040816c0 115.461224 93.518367 208.979592 208.979592 208.979592z" fill="#1ED760"></path><path d="M737.697959 736.757551c-10.34449 15.36-28.316735 20.48-43.781224 10.24-120.999184-74.396735-272.822857-89.756735-452.963266-48.796735-17.972245 5.22449-33.436735-7.627755-38.661224-23.092245-5.12-17.867755 7.732245-33.332245 23.196735-38.452244 195.604898-43.572245 365.505306-25.6 499.356734 56.424489 17.972245 7.732245 20.58449 28.212245 12.852245 43.676735zM799.451429 595.591837c-12.852245 17.972245-36.04898 25.70449-54.021225 12.852245-138.971429-84.636735-350.040816-110.236735-512.20898-58.932245-20.58449 5.12-43.781224-5.22449-48.901224-25.70449-5.12-20.48 5.12-43.572245 25.70449-48.692245 187.872653-56.52898 419.526531-28.316735 579.082449 69.172245 15.46449 7.732245 23.196735 33.436735 10.34449 51.30449zM804.571429 452.022857c-164.675918-97.48898-440.11102-107.833469-597.054694-59.036735-25.80898 7.732245-51.513469-7.732245-59.245715-30.824489-7.732245-25.6 7.732245-51.30449 30.92898-58.932245 182.752653-53.916735 483.892245-43.676735 674.272653 69.276734 23.196735 12.747755 30.92898 43.572245 18.076735 66.66449-12.852245 17.972245-43.781224 25.6-66.977959 12.852245z" fill="#121212"></path></svg>`,
  },
};

/**
 * 获取音乐嵌入iframe的URL
 * QQ音乐不支持嵌入，网易云和Spotify支持
 */
export function getMusicPlaybackMode(playlist) {
  const platform = playlist?.platform || "qq";

  if (platform === "local" && playlist?.audioSrc) {
    return "audio";
  }

  if (platform === "spotify") {
    return "spotify-sdk";
  }

  return "external";
}

export function getSpotifyEmbedUri(playlist) {
  return `spotify:playlist:${playlist.id}`;
}

export function parseSpotifyUri(uri) {
  if (typeof uri !== "string" || !uri.startsWith("spotify:")) {
    return null;
  }

  const [, type, id] = uri.split(":");
  if (!type || !id) {
    return null;
  }

  return { type, id };
}

export function getSpotifyPublicUrl(uri) {
  const parsed = parseSpotifyUri(uri);
  if (!parsed) return null;

  return `https://open.spotify.com/${parsed.type}/${parsed.id}`;
}

export function getPlaybackProgress(position = 0, duration = 0) {
  if (!duration || duration <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, position / duration));
}

export function formatPlaybackTime(milliseconds = 0) {
  const safeMilliseconds = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getMusicEmbedUrl(playlist, { autoplay = false } = {}) {
  const { id, platform } = playlist;

  if (platform === "netease") {
    return `https://music.163.com/outchain/player?type=0&id=${id}&auto=${autoplay ? 1 : 0}&height=330`;
  }

  if (platform === "spotify") {
    return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator`;
  }

  // QQ音乐不支持嵌入
  return null;
}

/**
 * 获取歌单详情页URL
 */
export function getPlaylistUrl(playlist) {
  const { id, platform, playlistUrl } = playlist;

  if (playlistUrl) {
    return playlistUrl;
  }

  if (platform === "local") {
    return playlist.sourceUrl || "#";
  }

  if (platform === "qq") {
    return `https://y.qq.com/n/ryqq/playlist/${id}`;
  }

  if (platform === "netease") {
    return `https://music.163.com/playlist?id=${id}`;
  }

  if (platform === "spotify") {
    return `https://open.spotify.com/playlist/${id}`;
  }

  return "#";
}

/**
 * 获取歌单封面URL
 */
export function getPlaylistCover(playlist) {
  const { id, platform, coverUrl } = playlist;

  // 如果歌单直接提供了封面URL，优先使用
  if (coverUrl) {
    return coverUrl;
  }

  if (platform === "qq") {
    // QQ音乐封面URL格式
    return `https://i.y.qq.com/v8/fav-song-music-center/pl540/${id}.jpg`;
  }

  if (platform === "netease") {
    // 网易云封面URL格式（使用API获取动态封面）
    return `https://music.126.net/api/song/cover/${id}.jpg`;
  }

  if (platform === "spotify") {
    return `https://placehold.co/300x300/1DB954/white?text=${encodeURIComponent(playlist.name)}`;
  }

  return `https://placehold.co/300x300/888/white?text=Music`;
}

/**
 * 异步获取网易云歌单详情（包含封面）
 * 需要在服务端调用，避免CORS问题
 */
export async function fetchNeteasePlaylistCover(playlistId) {
  try {
    const res = await fetch(`https://music.126.net/api/playlist/detail/dynamic?id=${playlistId}`, {
      headers: {
        'Referer': 'https://music.163.com/',
      },
    });
    const data = await res.json();
    return data?.playlist?.coverImgUrl || null;
  } catch {
    return null;
  }
}

/**
 * 获取所有歌单
 */
export function getAllPlaylists() {
  return MUSIC_PLAYLISTS;
}

function normalizePlaylistList(playlists) {
  return Array.isArray(playlists) ? playlists.filter(Boolean) : [];
}

function getDayOffset(date = new Date()) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return 0;

  const anchor = new Date("2026-04-02T00:00:00.000Z");
  const currentUtc = Date.UTC(
    safeDate.getUTCFullYear(),
    safeDate.getUTCMonth(),
    safeDate.getUTCDate()
  );
  const anchorUtc = Date.UTC(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth(),
    anchor.getUTCDate()
  );

  return Math.max(0, Math.floor((currentUtc - anchorUtc) / 86400000));
}

export function getEmbeddablePlaylists(playlists = MUSIC_PLAYLISTS) {
  return normalizePlaylistList(playlists).filter(
    (playlist) =>
      getMusicPlaybackMode(playlist) !== "external" &&
      playlist.allowEmbeddedPlayer !== false
  );
}

export function getSpotifyPlayablePlaylists(playlists = MUSIC_PLAYLISTS) {
  return normalizePlaylistList(playlists).filter(
    (playlist) =>
      getMusicPlaybackMode(playlist) === "spotify-sdk" &&
      playlist.allowEmbeddedPlayer !== false
  );
}

export function getPreferredPlaylist(playlists = MUSIC_PLAYLISTS, { preferPlatform } = {}) {
  const normalized = normalizePlaylistList(playlists);
  if (!normalized.length) return null;

  if (preferPlatform) {
    const preferred = normalized.find((playlist) => playlist.platform === preferPlatform);
    if (preferred) return preferred;
  }

  return normalized[0] ?? null;
}

export function getMusicDockPlaylists({
  playlists = MUSIC_PLAYLISTS,
  date = new Date(),
  limit = 3,
} = {}) {
  const candidates = getSpotifyPlayablePlaylists(playlists);

  if (!candidates.length) return [];

  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, candidates.length));
  const offset = getDayOffset(date) % candidates.length;

  return Array.from({ length: safeLimit }, (_, index) => candidates[(offset + index) % candidates.length]);
}

/**
 * 根据ID获取单个歌单
 */
export function getPlaylistById(id) {
  return MUSIC_PLAYLISTS.find((playlist) => playlist.id === id);
}

/**
 * 根据平台分组歌单
 */
export function getPlaylistsByPlatform() {
  const grouped = { local: [], qq: [], netease: [], spotify: [] };
  for (const playlist of MUSIC_PLAYLISTS) {
    const platform = playlist.platform || "qq";
    if (grouped[platform]) {
      grouped[platform].push(playlist);
    }
  }
  return grouped;
}
