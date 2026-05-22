import {
  verifyAdminPassword,
  createAdminSessionValue,
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
} from "@/src/lib/adminAuth";
import {
  WRITE_SESSION_COOKIE,
  createWriteSessionValue,
  getWriteSessionCookieOptions,
} from "@/src/lib/writeAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSafeRedirect(value) {
  if (!value || !value.startsWith("/")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

async function parseLoginRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    return {
      password: formData.get("password"),
      isFormPost: true,
    };
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return {
      password: "",
      isFormPost: false,
      parseError: "invalid-json",
    };
  }

  return {
    password: body?.password,
    isFormPost: false,
  };
}

function redirectToLogin(request, from, error) {
  const loginUrl = new URL("/admin-login", request.url);
  loginUrl.searchParams.set("from", getSafeRedirect(from));
  if (error) loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl, { status: 303 });
}

function createLoginSuccessResponse(request, from, isFormPost) {
  if (!isFormPost) return Response.json({ ok: true });
  return NextResponse.redirect(new URL(getSafeRedirect(from), request.url), {
    status: 303,
  });
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "/admin";
    const { password, isFormPost, parseError } = await parseLoginRequest(request);

    if (parseError) {
      return Response.json(
        { ok: false, error: "请求格式错误" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      if (isFormPost) return redirectToLogin(request, from, "invalid");
      return Response.json(
        { ok: false, error: "密码不能为空" },
        { status: 400 }
      );
    }

    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      if (isFormPost) return redirectToLogin(request, from, "invalid");
      return Response.json(
        { ok: false, error: "密码错误" },
        { status: 401 }
      );
    }

    const adminSessionValue = createAdminSessionValue();
    const writeSessionValue = createWriteSessionValue();

    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_SESSION_COOKIE,
      adminSessionValue,
      getAdminSessionCookieOptions()
    );
    cookieStore.set(
      WRITE_SESSION_COOKIE,
      writeSessionValue,
      getWriteSessionCookieOptions()
    );

    return createLoginSuccessResponse(request, from, isFormPost);
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { ok: false, error: "登录失败，请重试" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });
  cookieStore.set(WRITE_SESSION_COOKIE, "", {
    ...getWriteSessionCookieOptions(),
    maxAge: 0,
  });
  return Response.json({ ok: true });
}
