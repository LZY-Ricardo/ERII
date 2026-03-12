import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  buildCommentAuthCookieValue,
  createCaptchaChallenge,
  getCommentAuthCookieName,
  parseCommentAuthCookie,
  verifyCaptcha,
} from "@/src/lib/commentSecurity";
import { createComment, listCommentsByPostSlug } from "@/src/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(error) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

function parsePage(rawValue, fallback) {
  if (rawValue == null || rawValue === "") return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function getRequestIp(request) {
  const forwarded = String(request.headers.get("x-forwarded-for") ?? "")
    .split(",")[0]
    .trim();
  const realIp = String(request.headers.get("x-real-ip") ?? "").trim();
  return forwarded || realIp || "";
}

export async function GET(request) {
  const url = new URL(request.url);
  const slug = String(url.searchParams.get("slug") ?? "").trim();
  if (!slug) return badRequest("缺少 slug 参数。");

  const page = parsePage(url.searchParams.get("page"), 1);
  const pageSize = Math.min(30, parsePage(url.searchParams.get("pageSize"), 20));
  const authMap = parseCommentAuthCookie(request.cookies);

  const listResult = await listCommentsByPostSlug({
    slug,
    ownerTokenMap: authMap,
    page,
    pageSize,
  });

  const captcha = createCaptchaChallenge();
  return NextResponse.json({
    ok: true,
    comments: listResult.comments,
    pagination: {
      page: listResult.page,
      pageSize: listResult.pageSize,
      totalTopLevel: listResult.totalTopLevel,
      hasMore: listResult.hasMore,
    },
    captcha: {
      seed: captcha.seed,
      equation: captcha.equation,
    },
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("请求体 JSON 格式错误。");
  }

  const slug = String(body?.slug ?? "").trim();
  if (!slug) return badRequest("缺少文章标识。");

  const captchaResult = verifyCaptcha(body?.captchaSeed, body?.captcha);
  if (!captchaResult.ok) {
    return badRequest(captchaResult.error);
  }

  const createResult = await createComment({
    slug,
    parentId: body?.parentId,
    authorName: body?.authorName,
    authorEmail: body?.authorEmail,
    authorLink: body?.authorLink,
    content: body?.content,
    useMarkdown: body?.useMarkdown,
    isPrivate: body?.isPrivate,
    mailNotice: body?.mailNotice,
    ip: getRequestIp(request),
    userAgent: String(request.headers.get("user-agent") ?? ""),
  });

  if (!createResult.ok) {
    return badRequest(createResult.error);
  }

  const nextCaptcha = createCaptchaChallenge();
  const previousAuthMap = parseCommentAuthCookie(request.cookies);
  const cookieValue = buildCommentAuthCookieValue(
    previousAuthMap,
    createResult.comment.id,
    createResult.editToken
  );

  const response = NextResponse.json({
    ok: true,
    comment: createResult.comment,
    captcha: {
      seed: nextCaptcha.seed,
      equation: nextCaptcha.equation,
    },
  });
  response.cookies.set({
    name: getCommentAuthCookieName(),
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidateTag("posts");
  revalidateTag(`post:${slug}`);
  revalidateTag(`comments:${slug}`);

  return response;
}
