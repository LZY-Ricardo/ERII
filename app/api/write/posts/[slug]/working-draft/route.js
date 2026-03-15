import { NextResponse } from "next/server";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import {
  normalizePostInput,
  toApiPost,
} from "@/src/lib/content/contentService";
import {
  isMissingWorkingDraftTable,
  upsertPublishedPostWorkingDraft,
} from "@/src/lib/content/workingDrafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function badRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request, { params }) {
  if (!(await isWriteAuthed())) return unauthorized();

  const { slug } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON.");
  }

  const normalizedInput = normalizePostInput(body, {
    status: "published",
    fallbackSlugPrefix: "post",
  });
  if (normalizedInput.error) {
    return badRequest(normalizedInput.error);
  }

  let post;
  try {
    post = await upsertPublishedPostWorkingDraft({
      publishedSlug: slug,
      input: normalizedInput,
    });
  } catch (error) {
    if (error?.code === "INVALID_SLUG") {
      return badRequest("Invalid slug.");
    }
    if (error?.code === "POST_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
    }
    if (error?.code === "POST_NOT_PUBLISHED") {
      return badRequest("Only published posts can save working drafts.");
    }
    if (isMissingWorkingDraftTable(error)) {
      return NextResponse.json(
        { ok: false, error: "数据库缺少 post_working_drafts 表，请先执行迁移。" },
        { status: 500 }
      );
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    slug: post.slug,
    status: post.status,
    originalSlug: post.originalSlug,
    editorLookupSlug: post.editorLookupSlug,
    post: {
      ...post,
      ...toApiPost(post),
    },
  });
}
