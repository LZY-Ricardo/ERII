import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import {
  normalizePostInput,
  toApiPost,
  upsertPostContent,
} from "@/src/lib/content/contentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function isSlugConflictError(error) {
  return String(error?.code ?? "") === "SLUG_CONFLICT";
}

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function GET(request) {
  if (!(await isWriteAuthed())) return unauthorized();

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "draft";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  const db = requireDb();

  let result;
  try {
    if (status === "all") {
      result = await db.sql`
        SELECT slug, title, date, status, content_format, editor_source, updated_at
        FROM posts
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    } else {
      result = await db.sql`
        SELECT slug, title, date, status, content_format, editor_source, updated_at
        FROM posts
        WHERE status = ${status}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    }
  } catch (error) {
    if (String(error?.code ?? "") !== "42703") throw error;
    if (status === "all") {
      result = await db.sql`
        SELECT slug, title, date, status, updated_at
        FROM posts
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    } else {
      result = await db.sql`
        SELECT slug, title, date, status, updated_at
        FROM posts
        WHERE status = ${status}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    }
  }

  const posts = result.rows.map((row) => ({
    ...row,
    date: formatDate(row.date),
  }));

  return NextResponse.json({ ok: true, posts });
}

export async function POST(request) {
  if (!(await isWriteAuthed())) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const normalizedInput = normalizePostInput(body, {
    status: "draft",
    fallbackSlugPrefix: "draft",
  });
  if (normalizedInput.error) {
    return NextResponse.json(
      { ok: false, error: normalizedInput.error },
      { status: 400 }
    );
  }

  let post;
  try {
    post = await upsertPostContent({
      input: normalizedInput,
      status: "draft",
      originalSlug: body?.originalSlug,
      createdBy: "internal",
    });
  } catch (error) {
    if (isSlugConflictError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message || "Slug 已存在" },
        { status: 409 }
      );
    }
    throw error;
  }

  revalidateTag("posts");
  if (post.renamedFrom) {
    revalidateTag(`post:${post.renamedFrom}`);
    revalidateTag(`post-render:${post.renamedFrom}`);
    revalidateTag(`post-revision:${post.renamedFrom}`);
  }
  revalidateTag(`post:${post.slug}`);
  revalidateTag(`post-render:${post.slug}`);
  revalidateTag(`post-revision:${post.slug}`);

  return NextResponse.json({
    ok: true,
    slug: post.slug,
    status: "draft",
    originalSlug: post.slug,
    editorLookupSlug: post.slug,
    hasWorkingDraft: false,
    revisionId: post.revisionId,
    revisionNo: post.revisionNo,
    post: {
      ...toApiPost(post),
      originalSlug: post.slug,
      baseStatus: post.status,
      hasWorkingDraft: false,
      editorLookupSlug: post.slug,
      source: "db",
    },
  });
}
