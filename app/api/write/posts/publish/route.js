import { NextResponse } from "next/server";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { generateFallbackSlug, slugify } from "@/src/lib/slugify";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeDate(value) {
  const raw = String(value ?? "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function POST(request) {
  if (!isWriteAuthed()) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "");
  const description = String(body?.description ?? "").trim() || null;
  const cover = String(body?.cover ?? "").trim() || null;
  const date = normalizeDate(body?.date);
  const tags = parseTags(body?.tags);

  const providedSlug = String(body?.slug ?? "").trim();
  const slugBase = providedSlug || slugify(title) || generateFallbackSlug("post");
  const slug = slugBase;

  const db = requireDb();

  await db.sql`
    INSERT INTO posts (slug, title, date, description, cover, tags, content, status, updated_at, published_at)
    VALUES (${slug}, ${title || "无题"}, ${date}, ${description}, ${cover}, ${tags}, ${content}, 'published', NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      description = EXCLUDED.description,
      cover = EXCLUDED.cover,
      tags = EXCLUDED.tags,
      content = EXCLUDED.content,
      status = 'published',
      updated_at = NOW(),
      published_at = NOW()
  `;

  revalidateTag("posts");
  revalidateTag(`post:${slug}`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);

  return NextResponse.json({ ok: true, slug, status: "published" });
}
