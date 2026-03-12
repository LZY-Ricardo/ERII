import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { parseCommentAuthCookie } from "@/src/lib/commentSecurity";
import { editComment } from "@/src/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

function getRequestIp(request) {
  const forwarded = String(request.headers.get("x-forwarded-for") ?? "")
    .split(",")[0]
    .trim();
  const realIp = String(request.headers.get("x-real-ip") ?? "").trim();
  return forwarded || realIp || "";
}

export async function PATCH(request, { params }) {
  const { id: rawId } = await params;
  const commentId = Number(rawId);
  if (!Number.isFinite(commentId) || commentId <= 0) {
    return badRequest("评论 ID 无效。");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("请求体 JSON 格式错误。");
  }

  const authMap = parseCommentAuthCookie(request.cookies);
  const editToken = String(
    body?.editToken ?? authMap[String(commentId)] ?? ""
  ).trim();
  if (!editToken) {
    return NextResponse.json(
      { ok: false, error: "未找到编辑凭据，请使用发送该评论的浏览器。" },
      { status: 403 }
    );
  }

  const editResult = await editComment({
    commentId,
    editToken,
    content: body?.content,
    useMarkdown: body?.useMarkdown,
    ip: getRequestIp(request),
    userAgent: String(request.headers.get("user-agent") ?? ""),
  });

  if (!editResult.ok) {
    const status = /无权限|凭据/.test(editResult.error) ? 403 : 400;
    return NextResponse.json({ ok: false, error: editResult.error }, { status });
  }

  const response = NextResponse.json({
    ok: true,
    comment: editResult.comment,
  });

  revalidateTag(`comments:${editResult.comment.postSlug}`);

  return response;
}
