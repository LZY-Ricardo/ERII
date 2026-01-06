import crypto from "node:crypto";

export const WRITE_SESSION_COOKIE =
  process.env.ERII_WRITE_SESSION_COOKIE ?? "erii_write_session";

const WRITE_PASSWORD = process.env.ERII_WRITE_PASSWORD;
const WRITE_SESSION_SECRET =
  process.env.ERII_WRITE_SESSION_SECRET ?? WRITE_PASSWORD;

const WRITE_SESSION_MAX_AGE_SECONDS = Number(
  process.env.ERII_WRITE_SESSION_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 14
);

function sha256(value) {
  return crypto.createHash("sha256").update(String(value ?? "")).digest();
}

function safeEqual(a, b) {
  try {
    return crypto.timingSafeEqual(sha256(a), sha256(b));
  } catch {
    return false;
  }
}

function base64urlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64urlDecode(value) {
  return Buffer.from(String(value ?? ""), "base64url").toString("utf8");
}

function sign(payloadB64) {
  if (!WRITE_SESSION_SECRET) return "";
  return crypto
    .createHmac("sha256", WRITE_SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
}

export function isWriteAuthConfigured() {
  return Boolean(WRITE_PASSWORD && WRITE_SESSION_SECRET);
}

export function verifyWritePassword(password) {
  if (!WRITE_PASSWORD) return false;
  return safeEqual(password, WRITE_PASSWORD);
}

export function createWriteSessionValue() {
  if (!WRITE_SESSION_SECRET) {
    throw new Error(
      "Write session secret is not configured. Set ERII_WRITE_SESSION_SECRET."
    );
  }

  const payload = JSON.stringify({
    v: 1,
    exp: Date.now() + WRITE_SESSION_MAX_AGE_SECONDS * 1000,
  });

  const payloadB64 = base64urlEncode(payload);
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function isWriteSessionValid(value) {
  if (!WRITE_SESSION_SECRET) return false;

  const raw = String(value ?? "");
  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return false;

  const expected = sign(payloadB64);
  if (!safeEqual(sig, expected)) return false;

  try {
    const payloadJson = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadJson);
    if (!payload?.exp || typeof payload.exp !== "number") return false;
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
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
