import { requireDb } from "@/src/lib/db";
import { verifyAdminPassword, createAdminSession, serializeAdminSession, getAdminSessionCookieName } from "@/src/lib/adminAuth";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return Response.json({ ok: false, error: "密码不能为空" }, { status: 400 });
    }

    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      return Response.json({ ok: false, error: "密码错误" }, { status: 401 });
    }

    const session = createAdminSession();
    const sessionValue = serializeAdminSession(session);

    const cookieStore = await cookies();
    cookieStore.set(getAdminSessionCookieName(), sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ ok: false, error: "登录失败，请重试" }, { status: 500 });
  }
}
