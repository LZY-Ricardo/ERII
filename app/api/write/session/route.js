import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  WRITE_SESSION_COOKIE,
  createWriteSessionValue,
  getWriteSessionCookieOptions,
  isWriteAuthConfigured,
  isWriteSessionValid,
  verifyWritePassword,
} from "@/src/lib/writeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(WRITE_SESSION_COOKIE)?.value;
  const authenticated = isWriteSessionValid(cookieValue);
  return NextResponse.json({ ok: true, authenticated });
}

export async function POST(request) {
  if (!isWriteAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Write auth is not configured." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  if (!verifyWritePassword(body?.password)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const sessionValue = createWriteSessionValue();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    WRITE_SESSION_COOKIE,
    sessionValue,
    getWriteSessionCookieOptions()
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WRITE_SESSION_COOKIE, "", {
    ...getWriteSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
