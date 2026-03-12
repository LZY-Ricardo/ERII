import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export async function POST(request, { params }) {
  // Next.js 15 需要await params
  const { id } = await params;
  console.log("Delete API called with id:", id);

  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const commentId = parseInt(id, 10);
    console.log("Parsed commentId:", commentId, "from id:", id);

    if (!Number.isFinite(commentId)) {
      return Response.json({ ok: false, error: "无效的评论ID" }, { status: 400 });
    }

    const db = requireDb();

    await db.sql`
      UPDATE comments
      SET status = 'deleted', updated_at = NOW()
      WHERE id = ${commentId}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return Response.json({ ok: false, error: "删除评论失败" }, { status: 500 });
  }
}
