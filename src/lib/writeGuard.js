import { cookies } from "next/headers";
import { WRITE_SESSION_COOKIE, isWriteSessionValid } from "@/src/lib/writeAuth";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/src/lib/adminAuth";

/**
 * Server-side auth check: returns true if the request has
 * a valid write session OR a valid admin session.
 * (Admin privilege is a superset of write privilege.)
 */
export async function isWriteAuthed() {
  const cookieStore = await cookies();

  const writeCookie = cookieStore.get(WRITE_SESSION_COOKIE)?.value;
  if (isWriteSessionValid(writeCookie)) return true;

  const adminCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (isAdminSessionValid(adminCookie)) return true;

  return false;
}
