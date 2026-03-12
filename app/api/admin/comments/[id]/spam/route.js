import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export async function POST(request, { params }) {
  // Next.js 15 需要await params
  const { id } = await params;

  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const commentId = parseInt(id, 10);

    if (!Number.isFinite(commentId)) {
      return Response.json({ ok: false, error: "无效的评论ID" }, { status: 400 });
    }

    const db = requireDb();

    await db.sql`
      UPDATE comments
      SET status = 'spam', updated_at = NOW()
      WHERE id = ${commentId}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Mark spam error:", error);
    return Response.json({ ok: false, error: "标记垃圾评论失败" }, { status: 500 });
  }
}
