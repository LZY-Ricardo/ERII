import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

const DEFAULT_SETTINGS = {
  siteName: "",
  siteUrl: "",
  authorName: "",
  authorEmail: "",
  theme: "light",
  primaryColor: "rose",
  commentsEnabled: true,
  commentModeration: true,
  spamFilterEnabled: true,
  emailNotifications: false,
  notificationEmail: "",
  maintenanceMode: false,
  musicPlayerEnabled: true,
};

async function getSettings(db) {
  const result = await db.sql`
    SELECT value
    FROM admin_meta
    WHERE key = 'site_settings'
  `;

  if (result.rows?.[0]) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(result.rows[0].value) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  return DEFAULT_SETTINGS;
}

async function saveSettings(db, settings) {
  const value = JSON.stringify(settings);

  await db.sql`
    INSERT INTO admin_meta (key, value, updated_at)
    VALUES ('site_settings', ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `;

  return settings;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const settings = await getSettings(db);

    return Response.json({ ok: true, settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return Response.json(
      { ok: false, error: "获取设置失败" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const db = requireDb();

    // Merge with defaults
    const currentSettings = await getSettings(db);
    const newSettings = {
      ...currentSettings,
      ...body,
    };

    await saveSettings(db, newSettings);

    return Response.json({ ok: true, settings: newSettings });
  } catch (error) {
    console.error("Settings POST error:", error);
    return Response.json(
      { ok: false, error: "保存设置失败" },
      { status: 500 }
    );
  }
}
