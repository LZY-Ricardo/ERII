import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

function isMissingWorkingDraftTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "post_working_drafts" does not exist');
}

export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // published | draft | all

    let postsResult;
    if (status && status !== "all") {
      postsResult = await db.sql`
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
          COALESCE(cc.cnt, 0)::int AS comment_count,
          NULL::text AS draft_kind,
          p.slug AS editor_lookup_slug,
          CASE WHEN p.status = 'published' THEN p.slug ELSE NULL END AS published_slug
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
      postsResult = await db.sql`
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
          COALESCE(cc.cnt, 0)::int AS comment_count,
          NULL::text AS draft_kind,
          p.slug AS editor_lookup_slug,
          CASE WHEN p.status = 'published' THEN p.slug ELSE NULL END AS published_slug
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

    let workingDraftRows = [];
    if (status !== "published") {
      try {
        const workingDrafts = await db.sql`
          WITH comment_counts AS (
            SELECT post_slug, COUNT(*)::int AS cnt
            FROM comments
            WHERE status = 'approved'
            GROUP BY post_slug
          )
          SELECT
            wd.slug,
            wd.title,
            wd.date,
            'draft'::text AS status,
            wd.description,
            wd.cover,
            wd.tags,
            wd.created_at,
            wd.updated_at,
            COALESCE(cc.cnt, 0)::int AS comment_count,
            'working'::text AS draft_kind,
            p.slug AS editor_lookup_slug,
            p.slug AS published_slug
          FROM post_working_drafts wd
          INNER JOIN posts p ON p.id = wd.post_id
          LEFT JOIN comment_counts cc ON cc.post_slug = p.slug
          ORDER BY wd.updated_at DESC
          LIMIT 200
        `;
        workingDraftRows = workingDrafts.rows ?? [];
      } catch (error) {
        if (!isMissingWorkingDraftTableError(error)) {
          throw error;
        }
      }
    }

    const rows = [...(postsResult.rows ?? []), ...workingDraftRows]
      .map((r) => ({
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
      draftKind: r.draft_kind ?? null,
      editorLookupSlug: r.editor_lookup_slug ?? r.slug,
      publishedSlug: r.published_slug ?? null,
    }))
      .sort((a, b) => {
        const left = new Date(b.updatedAt ?? b.date ?? 0).getTime();
        const right = new Date(a.updatedAt ?? a.date ?? 0).getTime();
        return left - right;
      })
      .slice(0, 200);

    return Response.json({ ok: true, posts: rows });
  } catch (error) {
    console.error("Admin posts API error:", error);
    return Response.json(
      { ok: false, error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}
