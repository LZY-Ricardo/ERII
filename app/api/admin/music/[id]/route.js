import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";
import { normalizeMusicPlaylistInput } from "@/src/lib/musicCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const routeParams = await params;
    const currentId = String(routeParams?.id ?? "").trim();
    const body = await request.json();
    const normalized = normalizeMusicPlaylistInput(body);

    const result = await db.sql`
      UPDATE music_playlists
      SET
        id = ${normalized.entryId},
        name = ${normalized.name},
        description = ${normalized.description},
        platform = ${normalized.platform},
        playlist_id = ${normalized.id},
        playlist_url = ${normalized.playlistUrl},
        cover_url = ${normalized.coverUrl},
        is_published = ${normalized.isPublished},
        allow_embedded_player = ${normalized.allowEmbeddedPlayer},
        sort_order = ${normalized.sortOrder}
      WHERE id = ${currentId}
    `;

    if (!result.rowCount) {
      return Response.json({ ok: false, error: "目标歌单不存在" }, { status: 404 });
    }

    return Response.json({ ok: true, id: normalized.entryId });
  } catch (error) {
    console.error("Admin music PUT error:", error);
    return Response.json(
      { ok: false, error: error.message || "更新音乐歌单失败" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const routeParams = await params;
    const id = String(routeParams?.id ?? "").trim();

    if (!id) {
      return Response.json({ ok: false, error: "歌单 ID 不能为空" }, { status: 400 });
    }

    await db.sql`DELETE FROM music_playlists WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin music DELETE error:", error);
    return Response.json(
      { ok: false, error: error.message || "删除音乐歌单失败" },
      { status: 500 }
    );
  }
}
