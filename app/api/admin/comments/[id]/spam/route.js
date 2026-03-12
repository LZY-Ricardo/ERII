import { requireDb } from "@/src/lib/db";
import { deserializeAdminSession, isSessionValid, getAdminSessionCookieName } from "@/src/lib/adminAuth";
import { cookies } from "next/headers";

async function verifyAuth(request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getAdminSessionCookieName());

  if (!sessionCookie) {
    return { ok: false, error: "未登录", statusCode: 401 };
  }

  const session = deserializeAdminSession(sessionCookie.value);

  if (!session || !isSessionValid(session)) {
    return { ok: false, error: "会话已过期", statusCode: 401 };
  }

  return { ok: true };
}

export async function POST(request, { params }) {
  // Next.js 15 需要await params
  const { id } = await params;

  const authResult = await verifyAuth(request);

  if (!authResult.ok) {
    return Response.json({ ok: false, error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const commentId = parseInt(id, 10);

    if (!Number.isFinite(commentId)) {
      return Response.json({ ok: false, error: "无效的评论ID" }, { status: 400 });
    }

    const db = requireDb();

    await db.sql`
      UPDATE comments
      SET status = 'spam', updated_at = NOW()
      WHERE id = ${commentId}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Mark spam error:", error);
    return Response.json({ ok: false, error: "标记垃圾评论失败" }, { status: 500 });
  }
}
