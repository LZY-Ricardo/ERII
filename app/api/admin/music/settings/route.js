import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

const DEFAULT_SETTINGS = {
  musicPlayerEnabled: true,
};

async function getSiteSettings(db) {
  const result = await db.sql`
    SELECT value
    FROM admin_meta
    WHERE key = 'site_settings'
  `;

  if (!result.rows?.[0]?.value) {
    return DEFAULT_SETTINGS;
  }

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(result.rows[0].value) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const body = await request.json();
    const current = await getSiteSettings(db);
    const nextSettings = {
      ...current,
      musicPlayerEnabled: Boolean(body?.musicPlayerEnabled),
    };

    await db.sql`
      INSERT INTO admin_meta (key, value, updated_at)
      VALUES ('site_settings', ${JSON.stringify(nextSettings)}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    return Response.json({ ok: true, musicPlayerEnabled: nextSettings.musicPlayerEnabled });
  } catch (error) {
    console.error("Admin music settings PATCH error:", error);
    return Response.json(
      { ok: false, error: error.message || "保存音乐设置失败" },
      { status: 500 }
    );
  }
}
