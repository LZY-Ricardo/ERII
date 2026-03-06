import { put } from "@vercel/blob";
import { requireDb } from "@/src/lib/db";
import { fetchNotionPageAsPostInput } from "@/src/lib/content/adapters/notionAdapter";
import {
  normalizePostInput,
  toApiPost,
  upsertPostContent,
} from "@/src/lib/content/contentService";

function extractExtension(url, contentType) {
  const byType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };

  const typeExt = byType[String(contentType ?? "").toLowerCase()];
  if (typeExt) return typeExt;

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

async function mirrorAssetToBlob({ sourceUrl, prefix = "notion", dbClient }) {
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
    }, 'notion', ${sourceUrl})
    `;
  } catch {
    // best-effort bookkeeping
  }

  return blob.url;
}

async function findExistingPostBySourceRef(db, sourceRef) {
  const result = await db.sql`
    SELECT id, slug, source_updated_at
    FROM posts
    WHERE source_ref = ${sourceRef}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

function shouldSkipSync(existingSourceUpdatedAt, incomingSourceUpdatedAt) {
  if (!existingSourceUpdatedAt || !incomingSourceUpdatedAt) return false;
  const existing = new Date(existingSourceUpdatedAt).getTime();
  const incoming = new Date(incomingSourceUpdatedAt).getTime();
  if (Number.isNaN(existing) || Number.isNaN(incoming)) return false;
  return existing >= incoming;
}

export async function syncNotionPage({
  pageId,
  status = "draft",
  notionToken,
  mirrorAssets = true,
  dbClient,
  createdBy = "notion-sync",
}) {
  const db = dbClient ?? requireDb();

  const notionData = await fetchNotionPageAsPostInput({
    pageId,
    notionToken,
    assetResolver: mirrorAssets
      ? async (url, assetType) =>
          mirrorAssetToBlob({
            sourceUrl: url,
            prefix: assetType === "image" ? "notion-images" : "notion-assets",
            dbClient: db,
          })
      : async (url) => url,
  });

  const incoming = notionData.input;
  const existing = await findExistingPostBySourceRef(db, incoming.sourceRef);
  if (existing && shouldSkipSync(existing.source_updated_at, incoming.sourceUpdatedAt)) {
    return {
      skipped: true,
      reason: "Source is not newer than stored version.",
      existingSlug: existing.slug,
      sourceRef: incoming.sourceRef,
      sourceUpdatedAt: incoming.sourceUpdatedAt,
    };
  }

  const normalized = normalizePostInput(
    {
      ...incoming,
      slug: existing?.slug || undefined,
    },
    {
      status,
      fallbackSlugPrefix: "post",
    }
  );

  if (normalized.error) {
    throw new Error(normalized.error);
  }

  const post = await upsertPostContent({
    input: normalized,
    status,
    createdBy,
    dbClient: db,
  });

  return {
    skipped: false,
    post: toApiPost(post),
    sourceRef: incoming.sourceRef,
    sourceUpdatedAt: incoming.sourceUpdatedAt,
  };
}

