/**
 * Shared HMAC session signing/verification utilities.
 * Used by both admin and write authentication systems.
 */
import crypto from "node:crypto";

const SESSION_SECRET =
  process.env.ERII_WRITE_SESSION_SECRET ?? process.env.ERII_WRITE_PASSWORD;

function sha256(value) {
  return crypto.createHash("sha256").update(String(value ?? "")).digest();
}

export function safeEqual(a, b) {
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

function hmacSign(payloadB64, secret) {
  if (!secret) return "";
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

/**
 * Create an HMAC-signed session cookie value.
 * @param {object} options
 * @param {number} options.maxAgeMs - Session max age in milliseconds
 * @param {number} [options.version=1] - Payload version
 * @param {string} [options.secret] - Override default secret
 * @returns {string} base64url-encoded payload + "." + HMAC signature
 */
export function createSignedSession({ maxAgeMs, version = 1, secret } = {}) {
  const key = secret ?? SESSION_SECRET;
  if (!key) {
    throw new Error(
      "Session secret is not configured. Set ERII_WRITE_SESSION_SECRET."
    );
  }

  const payload = JSON.stringify({
    v: version,
    exp: Date.now() + maxAgeMs,
  });

  const payloadB64 = base64urlEncode(payload);
  const sig = hmacSign(payloadB64, key);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify an HMAC-signed session cookie value.
 * @param {string} value - The cookie value to verify
 * @param {string} [secret] - Override default secret
 * @returns {boolean} Whether the session is valid and not expired
 */
export function isSignedSessionValid(value, secret) {
  const key = secret ?? SESSION_SECRET;
  if (!key) return false;

  const raw = String(value ?? "");
  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return false;

  const expected = hmacSign(payloadB64, key);
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
