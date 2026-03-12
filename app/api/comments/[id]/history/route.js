import { NextResponse } from "next/server";
import { parseCommentAuthCookie } from "@/src/lib/commentSecurity";
import { listCommentEditHistory } from "@/src/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const commentId = Number(rawId);
  if (!Number.isFinite(commentId) || commentId <= 0) {
    return badRequest("评论 ID 无效。");
  }

  const authMap = parseCommentAuthCookie(request.cookies);
  const editToken = authMap[String(commentId)] ?? "";
  const historyResult = await listCommentEditHistory({ commentId, editToken });

  if (!historyResult.ok) {
    const status = /无权限/.test(historyResult.error) ? 403 : 400;
    return NextResponse.json({ ok: false, error: historyResult.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    history: historyResult.history,
  });
}
