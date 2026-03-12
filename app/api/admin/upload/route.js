import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/src/lib/adminGuard";
import { requireDb } from "@/src/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizePathSegment(value) {
  return String(value ?? "file")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");
}

/**
 * POST /api/admin/upload
 * 上传图片（管理后台专用）
 */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Blob storage not configured" },
      { status: 500 }
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json(
      { ok: false, error: "Missing file" },
      { status: 400 }
    );
  }

  const prefixRaw = form.get("prefix");
  const prefix = prefixRaw ? sanitizePathSegment(prefixRaw) : "images/projects";
  const filename = sanitizePathSegment(file.name || "upload");

  const pathname = `${prefix}/${filename}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  // 记录到 assets 表
  try {
    const db = requireDb();
    try {
      await db.sql`
        INSERT INTO assets (url, pathname, content_type, size, source_provider, source_url)
        VALUES (
          ${blob.url},
          ${blob.pathname},
          ${blob.contentType ?? null},
          ${blob.size ?? null},
          'internal',
          NULL
        )
      `;
    } catch (error) {
      if (String(error?.code ?? "") !== "42703") throw error;
      await db.sql`
        INSERT INTO assets (url, pathname, content_type, size)
        VALUES (${blob.url}, ${blob.pathname}, ${blob.contentType ?? null}, ${blob.size ?? null})
      `;
    }
  } catch {
    // best-effort: upload success is more important
  }

  return NextResponse.json({ ok: true, url: blob.url });
}
