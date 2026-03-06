import { NextResponse } from "next/server";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { normalizeSlugParam } from "@/src/lib/slugParam";
import { toApiPost } from "@/src/lib/content/contentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function formatDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
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

export async function GET(_request, { params }) {
  if (!(await isWriteAuthed())) return unauthorized();

  const { slug: rawSlug } = await params;
  const slug = normalizeSlugParam(rawSlug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
  }

  const db = requireDb();

  let result;
  try {
    result = await db.sql`
      SELECT
        id, slug, title, date, description, cover, tags, content, status,
        content_format, content_json, render_body, editor_source, source_ref, source_updated_at,
        latest_revision_id, created_at, updated_at, published_at
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `;
  } catch (error) {
    const code = String(error?.code ?? "");
    if (code !== "42703") throw error;

    result = await db.sql`
      SELECT id, slug, title, date, description, cover, tags, content, status, created_at, updated_at, published_at
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `;
  }

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const post = toApiPost({
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    date: formatDate(row.date),
    description: row.description ?? "",
    cover: row.cover ?? "",
    tags: row.tags ?? [],
    status: row.status,
    content: row.content ?? "",
    contentFormat: row.content_format ?? "mdx",
    contentJson: parseMaybeJson(row.content_json),
    renderBody: row.render_body ?? row.content ?? "",
    editorSource: row.editor_source ?? "internal",
    sourceRef: row.source_ref ?? null,
    sourceUpdatedAt: row.source_updated_at ?? null,
    latestRevisionId: row.latest_revision_id ?? null,
  });

  return NextResponse.json({
    ok: true,
    post: {
      ...post,
      source: "db",
    },
  });
}

