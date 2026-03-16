import { createHash } from "node:crypto";
import { load } from "cheerio";
import { htmlToMarkdown } from "../htmlToMarkdown.js";
import { EDITOR_SOURCES } from "../constants.js";

const JUEJIN_BASE_URL = "https://juejin.cn";
const DEFAULT_HEADERS = {
  "accept-language": "zh-CN,zh;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

function isJuejinHost(hostname) {
  const normalized = String(hostname ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  return normalized === "juejin.cn";
}

function toAbsoluteJuejinUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${JUEJIN_BASE_URL}${raw}`;
  if (raw.startsWith("juejin.cn/")) return `https://${raw}`;
  return `${JUEJIN_BASE_URL}/${raw.replace(/^\/+/, "")}`;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function normalizeIsoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toSaneIsoFromTimestamp(timestamp) {
  if (!Number.isFinite(Number(timestamp))) return null;

  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const maxAllowedYear = new Date().getUTCFullYear() + 1;
  if (year < 2018 || year > maxAllowedYear) return null;

  return date.toISOString();
}

function parseEpochFromHtml(html, fieldName) {
  const pattern = new RegExp(`${fieldName}:"?(\\d{10,13})"?`);
  const match = String(html ?? "").match(pattern);
  if (!match?.[1]) return null;

  const raw = match[1];
  const timestamp = raw.length === 13 ? Number(raw) : Number(raw) * 1000;
  if (!Number.isFinite(timestamp)) return null;

  return timestamp;
}

function decodeEscapedString(value) {
  const raw = String(value ?? "");
  if (!raw) return "";

  try {
    return JSON.parse(`"${raw.replace(/"/g, '\\"')}"`);
  } catch {
    return raw
      .replace(/\\u002F/g, "/")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function parseEscapedField(html, fieldName) {
  const pattern = new RegExp(`${fieldName}:"((?:\\\\.|[^"\\\\])*)"`);
  const match = String(html ?? "").match(pattern);
  return match?.[1] ? decodeEscapedString(match[1]) : "";
}

async function fetchJuejinHtml(url) {
  let cookieHeader = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: cookieHeader
        ? {
            ...DEFAULT_HEADERS,
            cookie: cookieHeader,
          }
        : DEFAULT_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Juejin request failed (${response.status}).`);
    }

    const html = await response.text();
    const challenge = parseJuejinWafChallenge(html);
    if (!challenge) {
      return html;
    }

    cookieHeader = solveJuejinWafChallenge(challenge);
    if (!cookieHeader) break;
  }

  throw new Error("掘金页面触发了风控挑战，暂时无法自动通过。");
}

function parseJuejinWafChallenge(html) {
  const match = String(html ?? "").match(/var\s+wci="([^"]+)",cs="([^"]+)"/);
  if (!match?.[1] || !match?.[2]) return null;

  return {
    cookieName: match[1],
    encodedState: match[2],
  };
}

function solveJuejinWafChallenge(challenge) {
  try {
    const state = JSON.parse(
      Buffer.from(challenge.encodedState, "base64").toString("utf8")
    );
    const prefix = Buffer.from(String(state?.v?.a ?? ""), "base64");
    const expected = Buffer.from(String(state?.v?.c ?? ""), "base64").toString("hex");
    if (!prefix.length || !expected) return "";

    for (let nonce = 0; nonce <= 1_000_000; nonce += 1) {
      const digest = createHash("sha256")
        .update(prefix)
        .update(String(nonce))
        .digest("hex");

      if (digest !== expected) continue;

      state.d = Buffer.from(String(nonce)).toString("base64");
      const cookieValue = Buffer.from(JSON.stringify(state)).toString("base64");
      return `${challenge.cookieName}=${cookieValue}`;
    }
  } catch {
    return "";
  }

  return "";
}

function dedupeArticleRefs(items) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const articleId = String(item?.articleId ?? "").trim();
    if (!articleId || seen.has(articleId)) continue;
    seen.add(articleId);
    output.push(item);
  }

  return output;
}

function normalizeProfileUrlInput(rawInput) {
  const raw = String(rawInput ?? "").trim();
  if (!raw) return "";

  if (/^[a-z0-9_-]+$/i.test(raw) && !raw.includes("/")) {
    return `${JUEJIN_BASE_URL}/user/${raw}/posts`;
  }

  const candidate = toAbsoluteJuejinUrl(raw);

  try {
    const url = new URL(candidate);
    if (!isJuejinHost(url.hostname)) return "";

    const match = url.pathname.match(/^\/user\/([^/?#]+)/i);
    if (!match?.[1]) return "";

    url.pathname = `/user/${match[1]}/posts`;
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
}

export function resolveJuejinArticleId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  if (/^[a-z0-9_-]{6,}$/i.test(raw) && !raw.includes("/")) {
    return raw;
  }

  const candidate = toAbsoluteJuejinUrl(raw);
  try {
    const url = new URL(candidate);
    if (!isJuejinHost(url.hostname)) return "";
    return String(url.pathname.match(/\/post\/([^/?#]+)/i)?.[1] ?? "").trim();
  } catch {
    return "";
  }
}

export function resolveJuejinProfileUserId(input) {
  const normalized = normalizeProfileUrlInput(input);
  if (!normalized) {
    const raw = String(input ?? "").trim();
    return /^[a-z0-9_-]+$/i.test(raw) ? raw : "";
  }

  try {
    return String(new URL(normalized).pathname.match(/^\/user\/([^/?#]+)/i)?.[1] ?? "").trim();
  } catch {
    return "";
  }
}

function extractProfilePageEntries($) {
  const items = [];

  $(".entry-list .entry").each((_, element) => {
    const entry = $(element);
    const link = entry.find('a[href^="/post/"]').first();
    const articleId =
      String(entry.attr("data-entry-id") ?? "").trim() ||
      resolveJuejinArticleId(link.attr("href"));

    if (!articleId) return;

    const title =
      String(link.attr("title") ?? "").trim() || String(link.text() ?? "").trim();
    const description = String(
      entry.find(".content, .abstract, .entry-abstract").first().text() ?? ""
    )
      .replace(/\s+/g, " ")
      .trim();

    items.push({
      articleId,
      articleUrl: toAbsoluteJuejinUrl(link.attr("href") || `/post/${articleId}`),
      title,
      description,
    });
  });

  return dedupeArticleRefs(items);
}

export async function scanJuejinProfileArticles({
  profileUrl,
  userId,
  maxPages = 50,
  maxArticles = 300,
}) {
  const canonicalProfileUrl = normalizeProfileUrlInput(profileUrl || userId);
  if (!canonicalProfileUrl) {
    throw new Error("请输入有效的掘金作者主页链接或用户 ID。");
  }

  const visited = new Set();
  const articles = [];
  let nextUrl = canonicalProfileUrl;
  let pagesVisited = 0;

  while (
    nextUrl &&
    pagesVisited < Math.max(1, Number(maxPages) || 1) &&
    articles.length < Math.max(1, Number(maxArticles) || 1)
  ) {
    if (visited.has(nextUrl)) break;
    visited.add(nextUrl);

    const html = await fetchJuejinHtml(nextUrl);
    const $ = load(html);
    const pageEntries = extractProfilePageEntries($);

    for (const entry of pageEntries) {
      if (articles.length >= maxArticles) break;
      if (!articles.some((item) => item.articleId === entry.articleId)) {
        articles.push(entry);
      }
    }

    const nextHref = String($("a.next-page").attr("href") ?? "").trim();
    nextUrl = nextHref ? toAbsoluteJuejinUrl(nextHref) : "";
    pagesVisited += 1;
  }

  return {
    userId: resolveJuejinProfileUserId(canonicalProfileUrl),
    profileUrl: canonicalProfileUrl,
    pagesVisited,
    articles,
  };
}

function extractArticleTitle($) {
  const heading = String($("h1.article-title").first().text() ?? "").trim();
  if (heading) return heading;

  return String($("title").first().text() ?? "")
    .replace(/\s*-\s*掘金.*/u, "")
    .trim();
}

function extractArticleDescription($, seedMeta) {
  const metaDescription = String($('meta[name="description"]').attr("content") ?? "").trim();
  if (metaDescription) return metaDescription;
  return String(seedMeta?.description ?? "").trim();
}

function extractArticleCover($, rawHtml) {
  const candidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    parseEscapedField(rawHtml, "cover_image"),
  ];

  return (
    candidates
      .map((value) => toAbsoluteJuejinUrl(value))
      .find((value) => value && !value.includes("icon-white-180")) || ""
  );
}

function extractArticleTime($, rawHtml) {
  const domDateTime = String($("time").first().attr("datetime") ?? "").trim();
  const updatedEpoch = parseEpochFromHtml(rawHtml, "mtime");
  const createdEpoch = parseEpochFromHtml(rawHtml, "ctime");
  const sourceTimestamp = updatedEpoch || createdEpoch;

  if (domDateTime) {
    return {
      date: normalizeDate(domDateTime),
      sourceUpdatedAt: toSaneIsoFromTimestamp(sourceTimestamp) || normalizeIsoDate(domDateTime),
    };
  }

  const timestamp = sourceTimestamp;

  if (!timestamp) {
    const fallback = new Date().toISOString();
    return {
      date: normalizeDate(fallback),
      sourceUpdatedAt: fallback,
    };
  }

  const iso = toSaneIsoFromTimestamp(timestamp) || new Date().toISOString();
  return {
    date: normalizeDate(iso),
    sourceUpdatedAt: iso,
  };
}

function extractArticleBodyHtml($) {
  const container = $("#article-root .article-viewer").first();
  if (!container.length) return "";

  container.find("style, script, noscript").remove();
  return String(container.html() ?? "").trim();
}

async function resolveArticleAssets(rawHtml, assetResolver) {
  if (!assetResolver) return rawHtml;

  const $ = load(`<article>${String(rawHtml ?? "")}</article>`);
  const root = $("article");

  for (const image of root.find("img").toArray()) {
    const currentSrc = toAbsoluteJuejinUrl(
      $(image).attr("src") || $(image).attr("data-src") || $(image).attr("data-original")
    );
    if (!currentSrc) continue;

    const nextSrc = await assetResolver(currentSrc, "image");
    if (nextSrc) {
      $(image).attr("src", nextSrc);
    }
  }

  return root.html() || "";
}

export async function fetchJuejinArticleAsPostInput({
  articleId,
  url,
  seedMeta,
  assetResolver,
}) {
  const resolvedArticleId = resolveJuejinArticleId(articleId || url);
  if (!resolvedArticleId) {
    throw new Error("请输入有效的掘金文章链接或文章 ID。");
  }

  const articleUrl = `${JUEJIN_BASE_URL}/post/${resolvedArticleId}`;
  const html = await fetchJuejinHtml(articleUrl);
  const $ = load(html);

  const title = extractArticleTitle($) || String(seedMeta?.title ?? "").trim() || "无题";
  const description = extractArticleDescription($, seedMeta);
  const timing = extractArticleTime($, html);
  let cover = extractArticleCover($, html);
  let bodyHtml = extractArticleBodyHtml($);

  if (!bodyHtml) {
    throw new Error("未能解析掘金文章正文，请稍后重试。");
  }

  if (assetResolver && cover) {
    cover = (await assetResolver(cover, "cover")) || cover;
  }

  bodyHtml = await resolveArticleAssets(bodyHtml, assetResolver);

  const content = htmlToMarkdown(bodyHtml);
  if (!content) {
    throw new Error("文章正文转换失败，请稍后重试。");
  }

  return {
    article: {
      articleId: resolvedArticleId,
      articleUrl,
      title,
      description,
      date: timing.date,
      cover: cover || null,
      sourceUpdatedAt: timing.sourceUpdatedAt,
    },
    input: {
      slug: null,
      title,
      date: timing.date,
      description: description || null,
      tags: [],
      cover: cover || null,
      content,
      contentFormat: "markdown",
      editorSource: EDITOR_SOURCES.IMPORT,
      sourceRef: `juejin:${resolvedArticleId}`,
      sourceUpdatedAt: timing.sourceUpdatedAt,
    },
  };
}
