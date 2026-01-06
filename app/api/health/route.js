import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { requireDb } from "@/src/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeErrorMessage(error) {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message.slice(0, 160);
  }
  return "unknown error";
}

export async function GET() {
  const response = {
    ok: true,
    db: { ok: false },
    blob: { ok: false },
    now: new Date().toISOString(),
  };

  try {
    const db = requireDb();
    await db.sql`SELECT 1`;
    response.db.ok = true;
  } catch (error) {
    response.ok = false;
    response.db.error = safeErrorMessage(error);
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Missing BLOB_READ_WRITE_TOKEN");
    }
    await list({ limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
    response.blob.ok = true;
  } catch (error) {
    response.ok = false;
    response.blob.error = safeErrorMessage(error);
  }

  return NextResponse.json(response, { status: response.ok ? 200 : 500 });
}

