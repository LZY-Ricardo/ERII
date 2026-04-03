import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";
import {
  getAdminMusicPlaylists,
  getMusicPlayerEnabled,
  normalizeMusicPlaylistInput,
} from "@/src/lib/musicCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getNextSortOrder(db) {
  const result = await db.sql`SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM music_playlists`;
  return Number(result.rows?.[0]?.max_order ?? 0) + 1;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    requireDb();
    const [playlists, musicPlayerEnabled] = await Promise.all([
      getAdminMusicPlaylists(),
      getMusicPlayerEnabled(),
    ]);

    return Response.json({ ok: true, playlists, musicPlayerEnabled });
  } catch (error) {
    console.error("Admin music GET error:", error);
    return Response.json({ ok: false, error: "获取音乐列表失败" }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const body = await request.json();
    const normalized = normalizeMusicPlaylistInput(body);
    const sortOrder = normalized.sortOrder > 0 ? normalized.sortOrder : await getNextSortOrder(db);

    const result = await db.sql`
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
        ${normalized.entryId},
        ${normalized.name},
        ${normalized.description},
        ${normalized.platform},
        ${normalized.id},
        ${normalized.playlistUrl},
        ${normalized.coverUrl},
        ${normalized.isPublished},
        ${normalized.allowEmbeddedPlayer},
        ${sortOrder}
      )
      ON CONFLICT (id) DO NOTHING
    `;

    if (!result.rowCount) {
      return Response.json(
        { ok: false, error: "该歌单已存在，请更换平台或歌单 ID。" },
        { status: 409 }
      );
    }

    return Response.json({ ok: true, id: normalized.entryId });
  } catch (error) {
    console.error("Admin music POST error:", error);
    return Response.json(
      { ok: false, error: error.message || "创建音乐歌单失败" },
      { status: 400 }
    );
  }
}
