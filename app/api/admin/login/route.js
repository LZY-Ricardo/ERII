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

    return Response.json({ ok: true });
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
