import { requireDb } from "@/src/lib/db";
import crypto from "node:crypto";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";
const ADMIN_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function getWritePassword() {
  return process.env.ERII_WRITE_PASSWORD || "";
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyAdminPassword(password) {
  const expectedHash = hashPassword(getWritePassword());
  const inputHash = hashPassword(password);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, "hex"),
    Buffer.from(inputHash, "hex")
  );
}

export function createAdminSession() {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE);
  return { token, expiresAt };
}

export function serializeAdminSession(session) {
  return JSON.stringify({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  });
}

export function deserializeAdminSession(cookieValue) {
  try {
    const data = JSON.parse(cookieValue);
    return {
      token: data.token,
      expiresAt: new Date(data.expiresAt),
    };
  } catch {
    return null;
  }
}

export function isSessionValid(session) {
  if (!session || !session.expiresAt) return false;
  return session.expiresAt > new Date();
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE_NAME;
}

// 管理员访问时间记录
export async function getLastVisitTime(db) {
  try {
    const result = await db.sql`
      SELECT value
      FROM admin_meta
      WHERE key = 'last_visit'
      LIMIT 1
    `;
    if (result.length > 0) {
      const timestamp = parseInt(result[0].value, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }
  } catch (error) {
    console.error("Failed to get last visit time:", error);
  }
  return null;
}

export async function updateLastVisitTime(db) {
  try {
    const now = Date.now();
    await db.sql`
      INSERT INTO admin_meta (key, value, updated_at)
      VALUES ('last_visit', ${String(now)}, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error("Failed to update last visit time:", error);
  }
}
