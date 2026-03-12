import crypto from "node:crypto";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;
const CAPTCHA_COOKIE_NAME = "comment_auth";
const MAX_AUTH_ENTRIES = 24;

function getSecret() {
  return (
    process.env.COMMENT_CAPTCHA_SECRET ||
    process.env.WRITE_PASSWORD ||
    "erii-comment-dev-secret"
  );
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function hashToken(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function createEditToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function createCaptchaChallenge() {
  const mode = Math.random() < 0.5 ? "add" : "sub";
  let a;
  let b;
  let answer;

  if (mode === "add") {
    a = Math.floor(Math.random() * 45) + 5;
    b = Math.floor(Math.random() * 30) + 1;
    answer = a + b;
  } else {
    a = Math.floor(Math.random() * 60) + 30;
    b = Math.floor(Math.random() * 30) + 1;
    if (b > a) {
      const swap = a;
      a = b;
      b = swap;
    }
    answer = a - b;
  }

  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${issuedAt}.${nonce}.${mode}.${a}.${b}`;
  const sig = signPayload(payload);
  const seed = toBase64Url(
    JSON.stringify({
      issuedAt,
      nonce,
      mode,
      a,
      b,
      sig,
    })
  );

  return {
    seed,
    equation: `${a} ${mode === "add" ? "+" : "-"} ${b} =`,
    answer,
  };
}

export function verifyCaptcha(seed, rawAnswer) {
  const answer = String(rawAnswer ?? "").trim();
  if (!seed || !answer) {
    return { ok: false, error: "验证码未输入。" };
  }
  if (!/^-?\d+$/.test(answer)) {
    return { ok: false, error: "验证码格式错误。" };
  }

  let parsed;
  try {
    parsed = safeJsonParse(fromBase64Url(String(seed)), null);
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "验证码已失效，请刷新。" };
  }

  const issuedAt = Number(parsed.issuedAt);
  const nonce = String(parsed.nonce ?? "");
  const mode = String(parsed.mode ?? "");
  const a = Number(parsed.a);
  const b = Number(parsed.b);
  const sig = String(parsed.sig ?? "");
  if (!Number.isFinite(issuedAt) || !Number.isFinite(a) || !Number.isFinite(b)) {
    return { ok: false, error: "验证码无效，请重试。" };
  }
  if (!["add", "sub"].includes(mode)) {
    return { ok: false, error: "验证码无效，请重试。" };
  }
  if (!nonce || !sig) {
    return { ok: false, error: "验证码无效，请重试。" };
  }

  const now = Date.now();
  if (now - issuedAt > CAPTCHA_TTL_MS) {
    return { ok: false, error: "验证码已过期，请重新获取。" };
  }

  const payload = `${issuedAt}.${nonce}.${mode}.${a}.${b}`;
  const expectedSig = signPayload(payload);
  if (sig !== expectedSig) {
    return { ok: false, error: "验证码校验失败，请重试。" };
  }

  const expected = mode === "add" ? a + b : a - b;
  if (Number(answer) !== expected) {
    return { ok: false, error: "验证码错误，请重新输入。" };
  }

  return { ok: true };
}

export function parseCommentAuthCookie(cookies) {
  const raw = cookies?.get?.(CAPTCHA_COOKIE_NAME)?.value;
  if (!raw) return {};
  let decoded;
  try {
    decoded = safeJsonParse(fromBase64Url(raw), {});
  } catch {
    decoded = {};
  }
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
    return {};
  }

  const out = {};
  const entries = Object.entries(decoded).slice(0, MAX_AUTH_ENTRIES);
  for (const [key, value] of entries) {
    const commentId = String(key).trim();
    const token = String(value ?? "").trim();
    if (!/^\d+$/.test(commentId)) continue;
    if (token.length < 16 || token.length > 128) continue;
    out[commentId] = token;
  }
  return out;
}

export function buildCommentAuthCookieValue(previousMap, commentId, token) {
  const merged = {
    ...(previousMap && typeof previousMap === "object" ? previousMap : {}),
  };
  merged[String(commentId)] = token;

  const entries = Object.entries(merged);
  if (entries.length > MAX_AUTH_ENTRIES) {
    entries.sort((a, b) => Number(b[0]) - Number(a[0]));
    const sliced = entries.slice(0, MAX_AUTH_ENTRIES);
    const compact = {};
    for (const [key, value] of sliced) compact[key] = value;
    return toBase64Url(JSON.stringify(compact));
  }

  return toBase64Url(JSON.stringify(merged));
}

export function getFingerprintFromRequest(request) {
  const forwardedFor = String(request.headers.get("x-forwarded-for") ?? "")
    .split(",")[0]
    .trim();
  const realIp = String(request.headers.get("x-real-ip") ?? "").trim();
  const userAgent = String(request.headers.get("user-agent") ?? "").trim();
  const acceptLanguage = String(request.headers.get("accept-language") ?? "").trim();
  const seed = `${forwardedFor || realIp}|${userAgent}|${acceptLanguage}`;
  return hashToken(seed || crypto.randomUUID());
}

export function getCommentAuthCookieName() {
  return CAPTCHA_COOKIE_NAME;
}
