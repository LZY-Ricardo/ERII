import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { isNotionConfigured } from "@/src/lib/content/adapters/notionAdapter";
import { syncNotionPage } from "@/src/lib/content/notionSync";
import {
  createSyncJob,
  markSyncJobFailed,
  markSyncJobRunning,
  markSyncJobSkipped,
  markSyncJobSuccess,
} from "@/src/lib/content/syncJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function resolveNotionPageId(body) {
  return (
    String(body?.pageId ?? "").trim() ||
    String(body?.sourceRef ?? "").trim() ||
    String(body?.page?.id ?? "").trim() ||
    String(body?.data?.id ?? "").trim() ||
    ""
  );
}

function normalizeStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "draft" ? "draft" : "published";
}

function normalizeEventType(value) {
  const raw = String(value ?? "").trim();
  return raw || "manual_sync";
}

function parseBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  const raw = String(value).trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

export async function POST(request) {
  if (!(await isWriteAuthed())) return unauthorized();
  if (!isNotionConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Notion integration is not configured." },
      { status: 500 }
    );
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

  const pageId = resolveNotionPageId(body);
  if (!pageId) {
    return NextResponse.json(
      { ok: false, error: "pageId is required." },
      { status: 400 }
    );
  }

  const status = normalizeStatus(body?.status);
  const eventType = normalizeEventType(body?.eventType);
  const mirrorAssets = parseBoolean(body?.mirrorAssets, true);
  const notionToken = String(body?.notionToken ?? "").trim() || undefined;
  const db = requireDb();

  let jobId = null;
  try {
    jobId = await createSyncJob({
      provider: "notion",
      sourceRef: pageId,
      eventType,
      payload: { request: body },
      dbClient: db,
    });
    await markSyncJobRunning({ jobId, dbClient: db });
  } catch {
    jobId = null;
  }

  try {
    const result = await syncNotionPage({
      pageId,
      status,
      notionToken,
      mirrorAssets,
      dbClient: db,
      createdBy: "notion-sync",
    });

    if (result.skipped) {
      if (jobId) {
        await markSyncJobSkipped({
          jobId,
          payload: result,
          dbClient: db,
        });
      }
      return NextResponse.json({
        ok: true,
        skipped: true,
        jobId,
        ...result,
      });
    }

    const slug = result?.post?.slug;
    if (slug) {
      revalidateTag("posts");
      revalidateTag(`post:${slug}`);
      revalidateTag(`post-render:${slug}`);
      revalidateTag(`post-revision:${slug}`);
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]");
      revalidatePath(`/blog/${encodeURIComponent(slug)}`);
    }

    if (jobId) {
      await markSyncJobSuccess({
        jobId,
        payload: result,
        dbClient: db,
      });
    }

    return NextResponse.json({
      ok: true,
      jobId,
      ...result,
    });
  } catch (error) {
    if (jobId) {
      await markSyncJobFailed({
        jobId,
        errorMessage: error?.message ?? "Unknown error",
        payload: { request: body },
        dbClient: db,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Notion sync failed.",
        jobId,
      },
      { status: 500 }
    );
  }
}

