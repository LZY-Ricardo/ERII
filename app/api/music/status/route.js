import { NextResponse } from "next/server";
import { getMusicPlayerEnabled } from "@/src/lib/musicCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const musicPlayerEnabled = await getMusicPlayerEnabled();
    return NextResponse.json({ ok: true, musicPlayerEnabled });
  } catch (error) {
    console.error("Music status GET error:", error);
    return NextResponse.json(
      { ok: false, musicPlayerEnabled: false, error: "获取音乐播放器状态失败" },
      { status: 500 }
    );
  }
}
