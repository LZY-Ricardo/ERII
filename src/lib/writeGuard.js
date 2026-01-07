import { cookies } from "next/headers";
import { WRITE_SESSION_COOKIE, isWriteSessionValid } from "@/src/lib/writeAuth";

export async function isWriteAuthed() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(WRITE_SESSION_COOKIE)?.value;
  return isWriteSessionValid(cookieValue);
}
