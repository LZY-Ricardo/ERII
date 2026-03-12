import { NextResponse } from "next/server";
import { getFingerprintFromRequest } from "@/src/lib/commentSecurity";
import { upvoteComment } from "@/src/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request, { params }) {
  const { id: rawId } = await params;
  const commentId = Number(rawId);
  if (!Number.isFinite(commentId) || commentId <= 0) {
    return badRequest("评论 ID 无效。");
  }

  const voteResult = await upvoteComment({
    commentId,
    fingerprintHash: getFingerprintFromRequest(request),
  });
  if (!voteResult.ok) {
    return badRequest(voteResult.error);
  }

  return NextResponse.json({
    ok: true,
    voted: voteResult.voted,
    voteCount: voteResult.voteCount,
  });
}
