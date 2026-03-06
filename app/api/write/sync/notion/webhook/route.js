import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireDb } from "@/src/lib/db";
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

function resolveWebhookSecret(request) {
  const headerSecret = request.headers.get("x-erii-sync-secret");
  if (headerSecret) return headerSecret;
  const url = new URL(request.url);
  return url.searchParams.get("secret") || "";
}

function resolveNotionPageIdFromEvent(body) {
  return (
    String(body?.pageId ?? "").trim() ||
    String(body?.data?.id ?? "").trim() ||
    String(body?.entity?.id ?? "").trim() ||
    String(body?.sourceRef ?? "").trim() ||
    ""
  );
}

export async function POST(request) {
  if (!isNotionConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Notion integration is not configured." },
      { status: 500 }
    );
  }

  const expectedSecret = String(process.env.ERII_NOTION_WEBHOOK_SECRET ?? "").trim();
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret is not configured." },
      { status: 500 }
    );
  }

  const givenSecret = resolveWebhookSecret(request);
  if (!givenSecret || givenSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

  const pageId = resolveNotionPageIdFromEvent(body);
  if (!pageId) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "No page id in event payload." },
      { status: 200 }
    );
  }

  const db = requireDb();
  const eventType = String(body?.type ?? "webhook_event").trim() || "webhook_event";

  let jobId = null;
  try {
    jobId = await createSyncJob({
      provider: "notion",
      sourceRef: pageId,
      eventType,
      payload: body,
      dbClient: db,
    });
    await markSyncJobRunning({ jobId, dbClient: db });
  } catch {
    jobId = null;
  }

  try {
    const result = await syncNotionPage({
      pageId,
      status: "published",
      mirrorAssets: true,
      dbClient: db,
      createdBy: "notion-webhook",
    });

    if (result.skipped) {
      if (jobId) {
        await markSyncJobSkipped({ jobId, payload: result, dbClient: db });
      }
      return NextResponse.json({ ok: true, jobId, ...result });
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
      await markSyncJobSuccess({ jobId, payload: result, dbClient: db });
    }

    return NextResponse.json({ ok: true, jobId, ...result });
  } catch (error) {
    if (jobId) {
      await markSyncJobFailed({
        jobId,
        errorMessage: error?.message ?? "Unknown error",
        payload: body,
        dbClient: db,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Notion webhook sync failed.",
        jobId,
      },
      { status: 500 }
    );
  }
}

