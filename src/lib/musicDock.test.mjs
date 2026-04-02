import test from "node:test";
import assert from "node:assert/strict";

import { getEmbeddablePlaylists, getMusicDockPlaylists } from "./music.js";

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

test("getMusicDockPlaylists prioritizes embeddable playlists and respects limit", () => {
  const playlists = [
    { id: "qq-only", platform: "qq" },
    { id: "netease-1", platform: "netease" },
    { id: "spotify-1", platform: "spotify" },
    { id: "netease-2", platform: "netease" },
  ];

  assert.deepEqual(
    getMusicDockPlaylists({
      playlists,
      date: new Date("2026-04-02T08:00:00.000Z"),
      limit: 2,
    }).map((item) => item.id),
    ["netease-1", "spotify-1"]
  );
});

test("getMusicDockPlaylists rotates recommendation by date", () => {
  const playlists = [
    { id: "netease-1", platform: "netease" },
    { id: "spotify-1", platform: "spotify" },
    { id: "netease-2", platform: "netease" },
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
  assert.deepEqual(dayOne, ["netease-1", "spotify-1", "netease-2"]);
  assert.deepEqual(dayTwo, ["spotify-1", "netease-2", "netease-1"]);
});
