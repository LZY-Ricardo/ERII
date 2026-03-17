import { revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";
import { normalizeCategoryValue } from "@/src/lib/postTaxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(error) {
  return Response.json({ ok: false, error }, { status: 400 });
}

function normalizeTagsArray(tags) {
  if (!Array.isArray(tags)) return [];
  const result = [];
  for (const raw of tags) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function applyCategoryToTags(tags, category) {
  const normalizedCategory = normalizeCategoryValue(category) || "未分类";
  const baseTags = normalizeTagsArray(tags).filter(
    (tag) => !normalizeCategoryValue(tag)
  );

  if (normalizedCategory !== "未分类") {
    baseTags.unshift(normalizedCategory);
  }

  return baseTags;
}

function isMissingWorkingDraftTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return (
    code === "42P01" &&
    message.includes('relation "post_working_drafts" does not exist')
  );
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON.");
  }

  const slug = String(body?.slug ?? "").trim();
  const draftKind = String(body?.draftKind ?? "").trim();
  const category = String(body?.category ?? "").trim();

  if (!slug) return badRequest("缺少 slug");
  if (!category) return badRequest("缺少分类");

  const db = requireDb();

  try {
    if (draftKind === "working") {
      // Update tags of a published post's working draft (does not affect the live published post).
      const base = await db.sql`
        SELECT id
        FROM posts
        WHERE slug = ${slug}
        LIMIT 1
      `;
      const postId = base.rows?.[0]?.id ? Number(base.rows[0].id) : 0;
      if (!postId) {
        return Response.json({ ok: false, error: "文章不存在" }, { status: 404 });
      }

      let current;
      try {
        current = await db.sql`
          SELECT tags
          FROM post_working_drafts
          WHERE post_id = ${postId}
          LIMIT 1
        `;
      } catch (error) {
        if (isMissingWorkingDraftTableError(error)) {
          return Response.json(
            { ok: false, error: "数据库缺少 post_working_drafts 表，请先执行迁移。" },
            { status: 500 }
          );
        }
        throw error;
      }

      if (!current.rows?.[0]) {
        return Response.json(
          { ok: false, error: "未找到该文章的修改稿" },
          { status: 404 }
        );
      }

      const nextTags = applyCategoryToTags(current.rows[0].tags, category);

      const updated = await db.sql`
        UPDATE post_working_drafts
        SET tags = ${nextTags}, updated_at = NOW()
        WHERE post_id = ${postId}
        RETURNING tags, updated_at
      `;

      return Response.json({
        ok: true,
        slug,
        draftKind: "working",
        tags: normalizeTagsArray(updated.rows?.[0]?.tags),
        updatedAt: updated.rows?.[0]?.updated_at ?? null,
      });
    }

    const current = await db.sql`
      SELECT tags
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (!current.rows?.[0]) {
      return Response.json({ ok: false, error: "文章不存在" }, { status: 404 });
    }

    const nextTags = applyCategoryToTags(current.rows[0].tags, category);

    const updated = await db.sql`
      UPDATE posts
      SET tags = ${nextTags}, updated_at = NOW()
      WHERE slug = ${slug}
      RETURNING tags, updated_at
    `;

    // Category affects listing and post pages.
    revalidateTag("posts");
    revalidateTag(`post:${slug}`);
    revalidateTag(`post-render:${slug}`);
    revalidateTag(`post-revision:${slug}`);

    return Response.json({
      ok: true,
      slug,
      tags: normalizeTagsArray(updated.rows?.[0]?.tags),
      updatedAt: updated.rows?.[0]?.updated_at ?? null,
    });
  } catch (error) {
    console.error("Admin post category update error:", error);
    return Response.json(
      { ok: false, error: "更新分类失败" },
      { status: 500 }
    );
  }
}

