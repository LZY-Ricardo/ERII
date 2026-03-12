/**
 * Write-system authentication – HMAC-signed sessions (shared crypto).
 */
import {
  safeEqual,
  createSignedSession,
  isSignedSessionValid,
} from "@/src/lib/sessionCrypto";

export const WRITE_SESSION_COOKIE =
  process.env.ERII_WRITE_SESSION_COOKIE ?? "erii_write_session";

const WRITE_PASSWORD = process.env.ERII_WRITE_PASSWORD;

const WRITE_SESSION_MAX_AGE_SECONDS = Number(
  process.env.ERII_WRITE_SESSION_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 14
);

export function isWriteAuthConfigured() {
  return Boolean(WRITE_PASSWORD);
}

export function verifyWritePassword(password) {
  if (!WRITE_PASSWORD) return false;
  return safeEqual(password, WRITE_PASSWORD);
}

export function createWriteSessionValue() {
  return createSignedSession({
    maxAgeMs: WRITE_SESSION_MAX_AGE_SECONDS * 1000,
    version: 1,
  });
}

export function isWriteSessionValid(value) {
  return isSignedSessionValid(value);
}

export function getWriteSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: WRITE_SESSION_MAX_AGE_SECONDS,
  };
}
