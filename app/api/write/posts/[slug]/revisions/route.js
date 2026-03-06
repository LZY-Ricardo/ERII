import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { normalizeSlugParam } from "@/src/lib/slugParam";
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

function parseMaybeJson(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  if (!(await isWriteAuthed())) return unauthorized();

  const { slug: rawSlug } = await params;
  const slug = normalizeSlugParam(rawSlug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Invalid slug." }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 30), 1), 200);
  const db = requireDb();

  const postResult = await db.sql`
    SELECT id, slug
    FROM posts
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const post = postResult.rows[0];
  if (!post) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }

  const revisionResult = await db.sql`
    SELECT id, revision_no, status, created_by, created_at
    FROM post_revisions
    WHERE post_id = ${post.id}
    ORDER BY revision_no DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({
    ok: true,
    slug: post.slug,
    revisions: revisionResult.rows,
  });
}

export async function POST(request, { params }) {
  if (!(await isWriteAuthed())) return unauthorized();

  const { slug: rawSlug } = await params;
  const slug = normalizeSlugParam(rawSlug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Invalid slug." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const revisionId = Number(body?.revisionId);
  if (!Number.isFinite(revisionId) || revisionId <= 0) {
    return NextResponse.json(
      { ok: false, error: "revisionId is required." },
      { status: 400 }
    );
  }

  const targetStatus = String(body?.status ?? "").trim().toLowerCase();
  const status = targetStatus === "published" ? "published" : "draft";
  const db = requireDb();

  const revisionResult = await db.sql`
    SELECT
      pr.id,
      pr.post_id,
      pr.status AS revision_status,
      pr.content_format,
      pr.content_text,
      pr.content_json,
      pr.render_body,
      pr.title,
      pr.description,
      pr.cover,
      pr.tags,
      p.slug,
      p.editor_source,
      p.source_ref,
      p.source_updated_at
    FROM post_revisions pr
    JOIN posts p ON p.id = pr.post_id
    WHERE p.slug = ${slug} AND pr.id = ${revisionId}
    LIMIT 1
  `;

  const revision = revisionResult.rows[0];
  if (!revision) {
    return NextResponse.json(
      { ok: false, error: "Revision not found." },
      { status: 404 }
    );
  }

  const normalizedInput = normalizePostInput(
    {
      slug: revision.slug,
      title: revision.title,
      description: revision.description,
      cover: revision.cover,
      tags: revision.tags ?? [],
      content: revision.content_text ?? "",
      contentFormat: revision.content_format ?? "mdx",
      contentJson: parseMaybeJson(revision.content_json),
      renderBody: revision.render_body ?? "",
      editorSource: revision.editor_source ?? "internal",
      sourceRef: revision.source_ref ?? null,
      sourceUpdatedAt: revision.source_updated_at ?? null,
      date: body?.date,
    },
    {
      status,
      fallbackSlugPrefix: "post",
    }
  );
  if (normalizedInput.error) {
    return NextResponse.json(
      { ok: false, error: normalizedInput.error },
      { status: 400 }
    );
  }

  const post = await upsertPostContent({
    input: normalizedInput,
    status,
    createdBy: "revision-restore",
    dbClient: db,
  });

  revalidateTag("posts");
  revalidateTag(`post:${post.slug}`);
  revalidateTag(`post-render:${post.slug}`);
  revalidateTag(`post-revision:${post.slug}`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]");
  revalidatePath(`/blog/${encodeURIComponent(post.slug)}`);

  return NextResponse.json({
    ok: true,
    slug: post.slug,
    status: post.status,
    restoredFromRevisionId: revisionId,
    revisionId: post.revisionId,
    revisionNo: post.revisionNo,
    post: toApiPost(post),
  });
}

