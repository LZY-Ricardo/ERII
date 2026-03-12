import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // published | draft | all

    let posts;

    if (status && status !== "all") {
      posts = await db.sql`
        SELECT
          p.slug,
          p.title,
          p.date,
          p.status,
          p.description,
          p.cover,
          p.tags,
          p.created_at,
          p.updated_at,
          COALESCE(cc.cnt, 0)::int AS comment_count
        FROM posts p
        LEFT JOIN (
          SELECT post_slug, COUNT(*)::int AS cnt
          FROM comments WHERE status = 'approved'
          GROUP BY post_slug
        ) cc ON cc.post_slug = p.slug
        WHERE p.status = ${status}
        ORDER BY p.date DESC
        LIMIT 200
      `;
    } else {
      posts = await db.sql`
        SELECT
          p.slug,
          p.title,
          p.date,
          p.status,
          p.description,
          p.cover,
          p.tags,
          p.created_at,
          p.updated_at,
          COALESCE(cc.cnt, 0)::int AS comment_count
        FROM posts p
        LEFT JOIN (
          SELECT post_slug, COUNT(*)::int AS cnt
          FROM comments WHERE status = 'approved'
          GROUP BY post_slug
        ) cc ON cc.post_slug = p.slug
        ORDER BY p.date DESC
        LIMIT 200
      `;
    }

    const rows = (posts.rows ?? []).map((r) => ({
      slug: r.slug,
      title: r.title,
      date: r.date,
      status: r.status,
      description: r.description ?? "",
      cover: r.cover ?? "",
      tags: r.tags ?? [],
      commentCount: r.comment_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return Response.json({ ok: true, posts: rows });
  } catch (error) {
    console.error("Admin posts API error:", error);
    return Response.json(
      { ok: false, error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}
