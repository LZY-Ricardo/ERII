import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import {
  importJuejinArticle,
  importJuejinProfile,
} from "@/src/lib/content/juejinImport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function normalizeMode(value) {
  return String(value ?? "").trim().toLowerCase() === "profile" ? "profile" : "single";
}

function parseBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;

  const raw = String(value).trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;

  return fallback;
}

function parseBoundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function collectAffectedSlugs(result) {
  if (!result) return [];
  if (result.mode === "single") {
    return result.skipped ? [] : [result.slug].filter(Boolean);
  }

  return (result.results ?? [])
    .filter((item) => item.status === "imported")
    .map((item) => item.slug)
    .filter(Boolean);
}

function revalidateImportedDrafts(slugs) {
  if (slugs.length) {
    revalidateTag("posts");
  }

  for (const slug of slugs) {
    revalidateTag(`post:${slug}`);
    revalidateTag(`post-render:${slug}`);
    revalidateTag(`post-revision:${slug}`);
  }

  revalidatePath("/write");
  revalidatePath("/admin/posts");
}

export async function POST(request) {
  if (!(await isWriteAuthed())) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const mode = normalizeMode(body?.mode);
  const mirrorAssets = parseBoolean(body?.mirrorAssets, true);
  const db = requireDb();

  try {
    if (mode === "profile") {
      const profileUrl = String(body?.profileUrl ?? "").trim();
      const userId = String(body?.userId ?? "").trim();

      if (!profileUrl && !userId) {
        return NextResponse.json(
          { ok: false, error: "profileUrl 或 userId 至少提供一个。" },
          { status: 400 }
        );
      }

      const result = await importJuejinProfile({
        profileUrl,
        userId,
        mirrorAssets,
        maxPages: parseBoundedInt(body?.maxPages, 50, 1, 100),
        maxArticles: parseBoundedInt(body?.maxArticles, 300, 1, 500),
        concurrency: parseBoundedInt(body?.concurrency, 3, 1, 4),
        dbClient: db,
      });

      revalidateImportedDrafts(collectAffectedSlugs(result));
      return NextResponse.json({ ok: true, ...result });
    }

    const url = String(body?.url ?? "").trim();
    const articleId = String(body?.articleId ?? "").trim();
    if (!url && !articleId) {
      return NextResponse.json(
        { ok: false, error: "url 或 articleId 至少提供一个。" },
        { status: 400 }
      );
    }

    const result = await importJuejinArticle({
      articleId,
      url,
      mirrorAssets,
      dbClient: db,
    });

    revalidateImportedDrafts(collectAffectedSlugs(result));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Juejin import failed.",
      },
      { status: 500 }
    );
  }
}
