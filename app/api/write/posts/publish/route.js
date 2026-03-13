import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isWriteAuthed } from "@/src/lib/writeGuard";
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

function isSlugConflictError(error) {
  return String(error?.code ?? "") === "SLUG_CONFLICT";
}

export async function POST(request) {
  if (!(await isWriteAuthed())) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const normalizedInput = normalizePostInput(body, {
    status: "published",
    fallbackSlugPrefix: "post",
  });
  if (normalizedInput.error) {
    return NextResponse.json(
      { ok: false, error: normalizedInput.error },
      { status: 400 }
    );
  }

  let post;
  try {
    post = await upsertPostContent({
      input: normalizedInput,
      status: "published",
      originalSlug: body?.originalSlug,
      createdBy: "internal",
    });
  } catch (error) {
    if (isSlugConflictError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message || "Slug 已存在" },
        { status: 409 }
      );
    }
    throw error;
  }

  revalidateTag("posts");
  if (post.renamedFrom) {
    revalidateTag(`post:${post.renamedFrom}`);
    revalidateTag(`post-render:${post.renamedFrom}`);
    revalidateTag(`post-revision:${post.renamedFrom}`);
    revalidatePath(`/blog/${encodeURIComponent(post.renamedFrom)}`);
  }
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
    status: "published",
    revisionId: post.revisionId,
    revisionNo: post.revisionNo,
    post: toApiPost(post),
  });
}
