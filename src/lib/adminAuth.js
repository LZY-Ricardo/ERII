/**
 * Admin authentication – HMAC-signed sessions (shared crypto with writeAuth).
 */
import {
  safeEqual,
  createSignedSession,
  isSignedSessionValid,
} from "@/src/lib/sessionCrypto";

export const ADMIN_SESSION_COOKIE = "erii_admin_session";

const ADMIN_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ADMIN_SESSION_MAX_AGE_SECONDS = ADMIN_SESSION_MAX_AGE_MS / 1000;

// ── Password verification ──────────────────────────────────────────

function getAdminPassword() {
  return process.env.ERII_WRITE_PASSWORD || "";
}

export function verifyAdminPassword(password) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return safeEqual(String(password ?? ""), expected);
}

// ── Session creation / validation ──────────────────────────────────

export function createAdminSessionValue() {
  return createSignedSession({
    maxAgeMs: ADMIN_SESSION_MAX_AGE_MS,
    version: 1,
  });
}

export function isAdminSessionValid(cookieValue) {
  return isSignedSessionValid(cookieValue);
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

// ── Server-side auth helper (for App Router server components) ─────

import { cookies } from "next/headers";

export async function isAdminAuthed() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

// ── Last visit time tracking (admin_meta table) ────────────────────

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
