import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMusicEntryId,
  normalizeMusicPlaylistInput,
  normalizeMusicPlaylistRow,
} from "./musicCatalog.js";

test("buildMusicEntryId normalizes platform and playlist id", () => {
  assert.equal(
    buildMusicEntryId({ platform: "Spotify", playlistId: " My Playlist 01 " }),
    "spotify:my-playlist-01"
  );
});

test("normalizeMusicPlaylistInput keeps spotify embed eligibility only for spotify", () => {
  const spotifyPlaylist = normalizeMusicPlaylistInput({
    name: "夜航歌单",
    platform: "spotify",
    id: "7GJbaMo5ptfJFFZXWNH6fQ",
    allowEmbeddedPlayer: true,
  });

  const qqPlaylist = normalizeMusicPlaylistInput({
    name: "通勤歌单",
    platform: "qq",
    id: "92034",
    allowEmbeddedPlayer: true,
  });

  assert.equal(spotifyPlaylist.allowEmbeddedPlayer, true);
  assert.equal(qqPlaylist.allowEmbeddedPlayer, false);
  assert.match(qqPlaylist.playlistUrl, /y\.qq\.com/);
});

test("normalizeMusicPlaylistInput rejects unsupported platforms", () => {
  assert.throws(
    () =>
      normalizeMusicPlaylistInput({
        name: "未知平台歌单",
        platform: "apple-music",
        id: "123",
      }),
    /仅支持 Spotify、QQ 音乐和网易云音乐/
  );
});

test("normalizeMusicPlaylistRow maps database fields to playlist shape", () => {
  const playlist = normalizeMusicPlaylistRow({
    entry_id: "spotify:test-playlist",
    playlist_id: "test-playlist",
    name: "测试歌单",
    description: "描述",
    platform: "spotify",
    cover_url: "https://example.com/cover.jpg",
    playlist_url: "",
    is_published: true,
    allow_embedded_player: true,
    sort_order: 6,
  });

  assert.deepEqual(
    {
      entryId: playlist.entryId,
      id: playlist.id,
      name: playlist.name,
      platform: playlist.platform,
      coverUrl: playlist.coverUrl,
      isPublished: playlist.isPublished,
      allowEmbeddedPlayer: playlist.allowEmbeddedPlayer,
      sortOrder: playlist.sortOrder,
    },
    {
      entryId: "spotify:test-playlist",
      id: "test-playlist",
      name: "测试歌单",
      platform: "spotify",
      coverUrl: "https://example.com/cover.jpg",
      isPublished: true,
      allowEmbeddedPlayer: true,
      sortOrder: 6,
    }
  );
  assert.match(playlist.playlistUrl, /open\.spotify\.com\/playlist\/test-playlist/);
});
