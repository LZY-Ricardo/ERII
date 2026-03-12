import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();

    // Run all stat queries in parallel
    const [postsResult, commentsResult, commentsByStatus, recentComments] =
      await Promise.all([
        db.sql`SELECT COUNT(*)::int AS count FROM posts`,
        db.sql`SELECT COUNT(*)::int AS count FROM comments WHERE status != 'deleted'`,
        db.sql`
          SELECT status, COUNT(*)::int AS count
          FROM comments
          WHERE status != 'deleted'
          GROUP BY status
        `,
        db.sql`
          SELECT id, author_name, post_slug, content_raw, status, created_at
          FROM comments
          WHERE status != 'deleted'
          ORDER BY created_at DESC
          LIMIT 5
        `,
      ]);

    const totalPosts = postsResult.rows?.[0]?.count ?? 0;
    const totalComments = commentsResult.rows?.[0]?.count ?? 0;

    const statusMap = {};
    for (const row of commentsByStatus.rows ?? []) {
      statusMap[row.status] = row.count;
    }

    return Response.json({
      ok: true,
      stats: {
        totalPosts,
        totalComments,
        pendingComments: statusMap.pending ?? 0,
        approvedComments: statusMap.approved ?? 0,
        spamComments: statusMap.spam ?? 0,
      },
      recentComments: (recentComments.rows ?? []).map((c) => ({
        id: c.id,
        authorName: c.author_name,
        postSlug: c.post_slug,
        contentPreview:
          c.content_raw.length > 80
            ? c.content_raw.slice(0, 80) + "…"
            : c.content_raw,
        status: c.status,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return Response.json(
      { ok: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
