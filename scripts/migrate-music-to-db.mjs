import { createPool } from "@vercel/postgres";
import { getAllPlaylists, getPlaylistUrl } from "../src/lib/music.js";
import { buildMusicEntryId } from "../src/lib/musicCatalog.js";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or POSTGRES_URL.");
}

const pool = createPool({ connectionString });

function toSeedRow(playlist, index) {
  return {
    id: buildMusicEntryId({
      platform: playlist.platform,
      playlistId: playlist.id,
    }),
    name: playlist.name,
    description: playlist.description ?? "",
    platform: playlist.platform,
    playlistId: playlist.id,
    playlistUrl: getPlaylistUrl(playlist),
    coverUrl: playlist.coverUrl ?? "",
    isPublished: true,
    allowEmbeddedPlayer: playlist.platform === "spotify",
    sortOrder: index + 1,
  };
}

async function main() {
  const playlists = getAllPlaylists().map(toSeedRow);

  for (const playlist of playlists) {
    await pool.sql`
      INSERT INTO music_playlists (
        id,
        name,
        description,
        platform,
        playlist_id,
        playlist_url,
        cover_url,
        is_published,
        allow_embedded_player,
        sort_order
      ) VALUES (
        ${playlist.id},
        ${playlist.name},
        ${playlist.description},
        ${playlist.platform},
        ${playlist.playlistId},
        ${playlist.playlistUrl},
        ${playlist.coverUrl},
        ${playlist.isPublished},
        ${playlist.allowEmbeddedPlayer},
        ${playlist.sortOrder}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        platform = EXCLUDED.platform,
        playlist_id = EXCLUDED.playlist_id,
        playlist_url = EXCLUDED.playlist_url,
        cover_url = EXCLUDED.cover_url,
        is_published = EXCLUDED.is_published,
        allow_embedded_player = EXCLUDED.allow_embedded_player,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
  }

  console.log(`已导入/更新 ${playlists.length} 条音乐歌单。`);
  await pool.end();
}

main().catch(async (error) => {
  console.error("迁移音乐歌单失败:", error);
  await pool.end();
  process.exit(1);
});
