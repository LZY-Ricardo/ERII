import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllPlaylists,
  getEmbeddablePlaylists,
  getMusicDockPlaylists,
  getMusicEmbedUrl,
  getMusicPlaybackMode,
  getPreferredPlaylist,
  getSpotifyPlayablePlaylists,
} from "./music.js";

test("default music playlists only expose spotify entries for the current player surface", () => {
  assert.ok(getAllPlaylists().every((playlist) => playlist.platform === "spotify"));
});

test("getEmbeddablePlaylists filters out platforms without embed support", () => {
  const playlists = [
    { id: "qq-only", platform: "qq" },
    { id: "netease-1", platform: "netease" },
    { id: "spotify-1", platform: "spotify" },
  ];

  assert.deepEqual(
    getEmbeddablePlaylists(playlists).map((item) => item.id),
    ["netease-1", "spotify-1"]
  );
});

test("getMusicDockPlaylists returns spotify playlists only and respects limit", () => {
  const playlists = [
    { id: "qq-only", platform: "qq" },
    { id: "netease-1", platform: "netease" },
    { id: "spotify-1", platform: "spotify" },
    { id: "spotify-2", platform: "spotify" },
  ];

  assert.deepEqual(
    getMusicDockPlaylists({
      playlists,
      date: new Date("2026-04-02T08:00:00.000Z"),
      limit: 2,
    }).map((item) => item.id),
    ["spotify-1", "spotify-2"]
  );
});

test("getMusicDockPlaylists rotates recommendation by date", () => {
  const playlists = [
    { id: "spotify-1", platform: "spotify" },
    { id: "spotify-2", platform: "spotify" },
    { id: "netease-1", platform: "netease" },
    { id: "spotify-3", platform: "spotify" },
  ];

  const dayOne = getMusicDockPlaylists({
    playlists,
    date: new Date("2026-04-02T08:00:00.000Z"),
    limit: 3,
  }).map((item) => item.id);

  const dayTwo = getMusicDockPlaylists({
    playlists,
    date: new Date("2026-04-03T08:00:00.000Z"),
    limit: 3,
  }).map((item) => item.id);

  assert.notDeepEqual(dayOne, dayTwo);
  assert.deepEqual(dayOne, ["spotify-1", "spotify-2", "spotify-3"]);
  assert.deepEqual(dayTwo, ["spotify-2", "spotify-3", "spotify-1"]);
});

test("getMusicPlaybackMode returns provider specific playback strategies", () => {
  assert.equal(getMusicPlaybackMode({ id: "spotify-1", platform: "spotify" }), "spotify-sdk");
  assert.equal(getMusicPlaybackMode({ id: "netease-1", platform: "netease" }), "iframe");
  assert.equal(getMusicPlaybackMode({ id: "qq-1", platform: "qq" }), "external");
});

test("getMusicEmbedUrl enables autoplay for netease only when requested", () => {
  const playlist = { id: "netease-1", platform: "netease" };

  assert.match(getMusicEmbedUrl(playlist), /auto=0/);
  assert.match(getMusicEmbedUrl(playlist, { autoplay: true }), /auto=1/);
});

test("getMusicDockPlaylists only returns spotify playlists for in-page playback", () => {
  const playlists = [
    { id: "netease-1", platform: "netease" },
    { id: "spotify-1", platform: "spotify" },
    { id: "spotify-2", platform: "spotify" },
  ];

  assert.deepEqual(
    getMusicDockPlaylists({
      playlists,
      date: new Date("2026-04-02T08:00:00.000Z"),
      limit: 2,
    }).map((item) => item.id),
    ["spotify-1", "spotify-2"]
  );
});

test("default playlists include spotify entries", () => {
  assert.ok(
    getAllPlaylists().some((playlist) => playlist.platform === "spotify")
  );
});

test("getSpotifyPlayablePlaylists filters to spotify entries only", () => {
  const playlists = [
    { id: "spotify-1", platform: "spotify" },
    { id: "netease-1", platform: "netease" },
    { id: "spotify-2", platform: "spotify" },
  ];

  assert.deepEqual(
    getSpotifyPlayablePlaylists(playlists).map((item) => item.id),
    ["spotify-1", "spotify-2"]
  );
});

test("getPreferredPlaylist picks spotify first when requested", () => {
  const playlists = [
    { id: "spotify-1", platform: "spotify" },
    { id: "netease-1", platform: "netease" },
  ];

  assert.equal(
    getPreferredPlaylist(playlists, { preferPlatform: "spotify" })?.id,
    "spotify-1"
  );
});
