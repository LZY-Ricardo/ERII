import { requireDb } from "@/src/lib/db";
import { deserializeAdminSession, isSessionValid, getAdminSessionCookieName, getLastVisitTime, updateLastVisitTime } from "@/src/lib/adminAuth";
import { cookies } from "next/headers";

async function verifyAuth(request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getAdminSessionCookieName());

  if (!sessionCookie) {
    return { ok: false, error: "未登录", statusCode: 401 };
  }

  const session = deserializeAdminSession(sessionCookie.value);

  if (!session || !isSessionValid(session)) {
    return { ok: false, error: "会话已过期", statusCode: 401 };
  }

  return { ok: true };
}

export async function GET(request) {
  const authResult = await verifyAuth(request);

  if (!authResult.ok) {
    return Response.json({ ok: false, error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const postSlug = searchParams.get("postSlug");

    let comments;

    // 根据筛选条件构建不同的查询
    if (status && status !== "all" && postSlug && postSlug !== "all") {
      comments = await db.sql`
        SELECT
          id,
          post_slug,
          parent_id,
          author_name,
          author_link,
          content_raw,
          status,
          is_private,
          created_at
        FROM comments
        WHERE status != 'deleted' AND status = ${status} AND post_slug = ${postSlug}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else if (status && status !== "all") {
      comments = await db.sql`
        SELECT
          id,
          post_slug,
          parent_id,
          author_name,
          author_link,
          content_raw,
          status,
          is_private,
          created_at
        FROM comments
        WHERE status != 'deleted' AND status = ${status}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else if (postSlug && postSlug !== "all") {
      comments = await db.sql`
        SELECT
          id,
          post_slug,
          parent_id,
          author_name,
          author_link,
          content_raw,
          status,
          is_private,
          created_at
        FROM comments
        WHERE status != 'deleted' AND post_slug = ${postSlug}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else {
      comments = await db.sql`
        SELECT
          id,
          post_slug,
          parent_id,
          author_name,
          author_link,
          content_raw,
          status,
          is_private,
          created_at
        FROM comments
        WHERE status != 'deleted'
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    // db.sql 返回的是 { rows: [...] } 格式
    const commentRows = comments.rows || [];
    console.log("Comment rows:", commentRows.length, "comments loaded");

    // 获取文章标题
    const slugs = [...new Set(commentRows.map((c) => c.post_slug))];
    let posts;
    if (slugs.length > 0) {
      posts = await db.sql`
        SELECT slug, title
        FROM posts
        WHERE slug = ANY(${slugs})
      `;
    }

    const postMap = posts && posts.rows ? Object.fromEntries(posts.rows.map((p) => [p.slug, p.title])) : {};

    // 获取上次访问时间
    const lastVisit = await getLastVisitTime(db);

    // 更新访问时间
    await updateLastVisitTime(db);

    const result = commentRows.map((comment) => {
      const contentPreview =
        comment.content_raw.length > 100
          ? comment.content_raw.slice(0, 100) + "..."
          : comment.content_raw;

      const isNew = lastVisit && new Date(comment.created_at) > lastVisit;

      return {
        id: comment.id,
        postSlug: comment.post_slug,
        postTitle: postMap[comment.post_slug] || comment.post_slug,
        parentId: comment.parent_id,
        authorName: comment.author_name,
        authorLink: comment.author_link,
        contentPreview,
        status: comment.status,
        isPrivate: comment.is_private,
        createdAt: comment.created_at,
        isNew,
      };
    });

    return Response.json({
      ok: true,
      comments: result,
      lastVisit: lastVisit ? lastVisit.toISOString() : null,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return Response.json({ ok: false, error: "获取评论列表失败" }, { status: 500 });
  }
}
