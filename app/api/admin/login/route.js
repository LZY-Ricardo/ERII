import {
  verifyAdminPassword,
  createAdminSessionValue,
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
} from "@/src/lib/adminAuth";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return Response.json(
        { ok: false, error: "密码不能为空" },
        { status: 400 }
      );
    }

    const isValid = verifyAdminPassword(password);

    if (!isValid) {
      return Response.json(
        { ok: false, error: "密码错误" },
        { status: 401 }
      );
    }

    const sessionValue = createAdminSessionValue();

    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_SESSION_COOKIE,
      sessionValue,
      getAdminSessionCookieOptions()
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { ok: false, error: "登录失败，请重试" },
      { status: 500 }
    );
  }
}
