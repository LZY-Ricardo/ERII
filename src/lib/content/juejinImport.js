import { put } from "@vercel/blob";
import { requireDb } from "../db.js";
import { generateFallbackSlug, slugify } from "../slugify.js";
import { normalizePostInput, upsertPostContent } from "./contentService.js";
import {
  fetchJuejinArticleAsPostInput,
  resolveJuejinArticleId,
  scanJuejinProfileArticles,
} from "./adapters/juejinAdapter.js";

function extractExtension(url, contentType) {
  const byType = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  };

  const typeExtension = byType[String(contentType ?? "").toLowerCase()];
  if (typeExtension) return typeExtension;

  const match = String(url ?? "").match(/\.([a-z0-9]{2,6})(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "bin";
}

function toSafeFileName(value) {
  return String(value ?? "file")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function toImportPostSummary(post) {
  if (!post) return null;
  return {
    slug: post.slug,
    title: post.title,
    status: post.status,
    editorSource: post.editorSource,
    sourceRef: post.sourceRef,
  };
}

function appendSlugSuffix(base, suffix) {
  const normalizedBase = String(base ?? "").trim().replace(/-+$/g, "");
  const normalizedSuffix = String(suffix ?? "").trim();
  if (!normalizedSuffix) return normalizedBase;

  const maxBaseLength = Math.max(1, 80 - normalizedSuffix.length);
  return `${normalizedBase.slice(0, maxBaseLength).replace(/-+$/g, "")}${normalizedSuffix}`;
}

async function mirrorAssetToBlob({ sourceUrl, prefix, dbClient }) {
  if (!sourceUrl) return sourceUrl;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return sourceUrl;

  const response = await fetch(sourceUrl, { cache: "no-store" });
  if (!response.ok) return sourceUrl;

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = extractExtension(sourceUrl, contentType);
  const pathname = `${toSafeFileName(prefix)}/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    contentType,
    token,
  });

  try {
    await dbClient.sql`
      INSERT INTO assets (url, pathname, content_type, size, source_provider, source_url)
      VALUES (${blob.url}, ${blob.pathname}, ${blob.contentType ?? contentType}, ${
      blob.size ?? buffer.length
    }, 'external', ${sourceUrl})
    `;
  } catch {
    // best-effort bookkeeping
  }

  return blob.url;
}

async function findExistingPostBySourceRef(db, sourceRef) {
  const result = await db.sql`
    SELECT id, slug, title, status, editor_source, source_ref, source_updated_at
    FROM posts
    WHERE source_ref = ${sourceRef}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

async function findPostBySlug(db, slug) {
  const result = await db.sql`
    SELECT id, slug, source_ref
    FROM posts
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

async function ensureAvailableImportSlug({
  db,
  title,
  sourceRef,
  fallbackPrefix = "juejin",
}) {
  const baseSlug = slugify(title) || generateFallbackSlug(fallbackPrefix);

  for (let index = 0; index < 100; index += 1) {
    const candidate =
      index === 0 ? baseSlug : appendSlugSuffix(baseSlug, `-${index + 1}`);
    const existing = await findPostBySlug(db, candidate);

    if (!existing) return candidate;
    if (existing.source_ref === sourceRef) return candidate;
  }

  return appendSlugSuffix(baseSlug, `-${Date.now().toString(36)}`);
}

function createImportStatus(result) {
  return result.skipped ? "skipped" : "imported";
}

async function persistImportedArticle({
  db,
  incoming,
  article,
  createdBy,
}) {
  const existing = await findExistingPostBySourceRef(db, incoming.sourceRef);
  if (existing) {
    return {
      skipped: true,
      slug: existing.slug,
      post: {
        slug: existing.slug,
        title: existing.title,
        status: existing.status,
        editorSource: "import",
        sourceRef: incoming.sourceRef,
      },
      articleId: article.articleId,
      title: article.title,
      sourceRef: incoming.sourceRef,
      sourceUpdatedAt: incoming.sourceUpdatedAt,
    };
  }

  const nextSlug = await ensureAvailableImportSlug({
    db,
    title: incoming.title,
    sourceRef: incoming.sourceRef,
  });

  const normalizedInput = normalizePostInput(
    {
      ...incoming,
      slug: nextSlug,
    },
    {
      status: "draft",
      fallbackSlugPrefix: "juejin",
    }
  );

  if (normalizedInput.error) {
    throw new Error(normalizedInput.error);
  }

  const post = await upsertPostContent({
    input: normalizedInput,
    status: "draft",
    createdBy,
    dbClient: db,
  });

  return {
    skipped: false,
    slug: post.slug,
    post: toImportPostSummary(post),
    articleId: article.articleId,
    title: article.title,
    sourceRef: incoming.sourceRef,
    sourceUpdatedAt: incoming.sourceUpdatedAt,
  };
}

async function importSingleArticle({
  db,
  articleId,
  url,
  mirrorAssets,
  createdBy,
  seedMeta,
}) {
  const resolvedArticleId = resolveJuejinArticleId(articleId || url);
  if (!resolvedArticleId) {
    throw new Error("请输入有效的掘金文章链接或文章 ID。");
  }

  const sourceRef = `juejin:${resolvedArticleId}`;
  const existing = await findExistingPostBySourceRef(db, sourceRef);
  if (existing) {
    return {
      skipped: true,
      slug: existing.slug,
      post: {
        slug: existing.slug,
        title: existing.title,
        status: existing.status,
        editorSource: existing.editor_source ?? "import",
        sourceRef,
      },
      articleId: resolvedArticleId,
      title: existing.title || seedMeta?.title || "",
      sourceRef,
      sourceUpdatedAt: existing.source_updated_at ?? null,
    };
  }

  const articleData = await fetchJuejinArticleAsPostInput({
    articleId: resolvedArticleId,
    url,
    seedMeta,
    assetResolver: mirrorAssets
      ? async (sourceUrl, assetType) =>
          mirrorAssetToBlob({
            sourceUrl,
            prefix: assetType === "cover" ? "juejin-covers" : "juejin-images",
            dbClient: db,
          })
      : async (sourceUrl) => sourceUrl,
  });

  return persistImportedArticle({
    db,
    incoming: articleData.input,
    article: articleData.article,
    createdBy,
  });
}

async function mapWithConcurrency(items, limit, mapper) {
  const concurrency = Math.max(1, Number(limit) || 1);
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

export async function importJuejinArticle({
  articleId,
  url,
  mirrorAssets = true,
  dbClient,
  createdBy = "juejin-import",
}) {
  const db = dbClient ?? requireDb();
  const result = await importSingleArticle({
    db,
    articleId,
    url,
    mirrorAssets,
    createdBy,
  });

  return {
    mode: "single",
    ...result,
  };
}

export async function importJuejinProfile({
  profileUrl,
  userId,
  mirrorAssets = true,
  maxPages = 50,
  maxArticles = 300,
  concurrency = 3,
  dbClient,
  createdBy = "juejin-import",
}) {
  const db = dbClient ?? requireDb();
  const profile = await scanJuejinProfileArticles({
    profileUrl,
    userId,
    maxPages,
    maxArticles,
  });

  const results = await mapWithConcurrency(
    profile.articles,
    Math.max(1, Math.min(Number(concurrency) || 1, 4)),
    async (articleRef) => {
      try {
        const result = await importSingleArticle({
          db,
          articleId: articleRef.articleId,
          url: articleRef.articleUrl,
          mirrorAssets,
          createdBy,
          seedMeta: articleRef,
        });

        return {
          articleId: articleRef.articleId,
          articleUrl: articleRef.articleUrl,
          title: result.title || articleRef.title,
          slug: result.slug,
          status: createImportStatus(result),
          error: null,
        };
      } catch (error) {
        return {
          articleId: articleRef.articleId,
          articleUrl: articleRef.articleUrl,
          title: articleRef.title,
          slug: null,
          status: "failed",
          error: error?.message ?? "导入失败",
        };
      }
    }
  );

  const summary = results.reduce(
    (accumulator, item) => {
      accumulator.scanned += 1;
      if (item.status === "imported") accumulator.imported += 1;
      if (item.status === "skipped") accumulator.skipped += 1;
      if (item.status === "failed") accumulator.failed += 1;
      return accumulator;
    },
    {
      scanned: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
    }
  );

  return {
    mode: "profile",
    profile: {
      userId: profile.userId,
      profileUrl: profile.profileUrl,
      pagesVisited: profile.pagesVisited,
    },
    summary,
    results,
  };
}
