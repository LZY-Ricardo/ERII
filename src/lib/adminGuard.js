/**
 * Server-side admin API route guard.
 * Returns null if authenticated, or a 401 Response if not.
 */
import { isAdminAuthed } from "@/src/lib/adminAuth";

export async function requireAdmin() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return Response.json(
      { ok: false, error: "未登录或会话已过期" },
      { status: 401 }
    );
  }
  return null;
}
