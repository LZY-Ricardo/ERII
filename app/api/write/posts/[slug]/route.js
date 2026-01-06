import { NextResponse } from "next/server";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(_request, { params }) {
  if (!isWriteAuthed()) return unauthorized();

  const { slug } = await params;
  const db = requireDb();

  const result = await db.sql`
    SELECT slug, title, date, description, cover, tags, content, status, updated_at, published_at
    FROM posts
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const post = result.rows[0];
  if (!post) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, post });
}

