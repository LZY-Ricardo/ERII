import { NextResponse } from "next/server";
import { getPublicMusicCatalog } from "@/src/lib/musicCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublicMusicCatalog();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error("Music catalog GET error:", error);
    return NextResponse.json(
      { ok: false, error: "获取音乐目录失败" },
      { status: 500 }
    );
  }
}
