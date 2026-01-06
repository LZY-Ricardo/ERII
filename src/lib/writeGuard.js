import { cookies } from "next/headers";
import { WRITE_SESSION_COOKIE, isWriteSessionValid } from "@/src/lib/writeAuth";

export function isWriteAuthed() {
  const cookieValue = cookies().get(WRITE_SESSION_COOKIE)?.value;
  return isWriteSessionValid(cookieValue);
}

