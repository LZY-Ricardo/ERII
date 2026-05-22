import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "erii_admin_session";

/**
 * Paths that should be accessible WITHOUT admin auth.
 */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);

/**
 * Lightweight cookie format check for Edge Runtime (no node:crypto).
 * Full HMAC verification happens in API route guards (requireAdmin).
 * Proxy only does: cookie exists + looks like "payload.sig".
 */
function hasValidCookieFormat(value) {
  if (!value || typeof value !== "string") return false;
  const dot = value.indexOf(".");
  return dot > 0 && dot < value.length - 1;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* and /api/admin/*
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin) return NextResponse.next();

  // Allow public admin paths (login page & login API)
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  // Check admin session cookie (lightweight format check)
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const hasSession = hasValidCookieFormat(sessionCookie);

  if (!hasSession) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "未登录或会话已过期" },
        { status: 401 }
      );
    }
    // Page routes → redirect to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin-login";
    loginUrl.search = "";
    loginUrl.searchParams.set("from", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
