import { NextResponse } from "next/server";
import { isWriteAuthed } from "@/src/lib/writeGuard";
import { normalizeSlugParam } from "@/src/lib/slugParam";
import { toApiPost } from "@/src/lib/content/contentService";
import { getEditorPostBySlug } from "@/src/lib/content/workingDrafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(_request, { params }) {
  if (!(await isWriteAuthed())) return unauthorized();

  const { slug: rawSlug } = await params;
  const slug = normalizeSlugParam(rawSlug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Invalid slug" }, { status: 400 });
  }

  const post = await getEditorPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    post: {
      ...post,
      ...toApiPost(post),
    },
  });
}
