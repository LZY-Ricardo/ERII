import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { requireDb } from "@/src/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function sanitizePathSegment(value) {
  return String(value ?? "file")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");
}

export async function POST(request) {
  if (!(await isWriteAuthed())) return unauthorized();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Missing BLOB_READ_WRITE_TOKEN" },
      { status: 500 }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json(
      { ok: false, error: "Missing file." },
      { status: 400 }
    );
  }

  const prefixRaw = form.get("prefix");
  const prefix = prefixRaw ? sanitizePathSegment(prefixRaw) : "images";
  const filename = sanitizePathSegment(file.name || "upload");

  const pathname = `${prefix}/${filename}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  try {
    const db = requireDb();
    await db.sql`
      INSERT INTO assets (url, pathname, content_type, size)
      VALUES (${blob.url}, ${blob.pathname}, ${blob.contentType ?? null}, ${blob.size ?? null})
    `;
  } catch {
    // best-effort: upload success is more important than bookkeeping
  }

  return NextResponse.json({ ok: true, url: blob.url, blob });
}
