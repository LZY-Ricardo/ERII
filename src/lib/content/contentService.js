import { requireDb } from "@/src/lib/db";
import { generateFallbackSlug, slugify } from "@/src/lib/slugify";
import { normalizeSlugParam } from "@/src/lib/slugParam";
import {
  DEFAULT_EDITOR_SOURCE,
  DEFAULT_CONTENT_FORMAT,
  EDITOR_SOURCES,
  normalizeContentFormat,
  normalizeEditorSource,
} from "@/src/lib/content/constants";
import { buildRenderBody, parseMaybeJson } from "@/src/lib/content/renderPipeline";

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeDate(value) {
  const raw = String(value ?? "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

function parseTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSourceUpdatedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeSlug(providedSlug, title, fallbackPrefix) {
  const raw = String(providedSlug ?? "").trim();
  const normalizedProvidedSlug = raw ? slugify(raw) : "";
  if (raw && !normalizedProvidedSlug) {
    return { error: "Invalid slug.", slug: "" };
  }

  const slug =
    normalizedProvidedSlug || slugify(title) || generateFallbackSlug(fallbackPrefix);
  return { slug };
}

function normalizeOriginalSlug(value) {
  return normalizeSlugParam(value);
}

function toNullableTrimmedText(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function isLegacySchemaError(error) {
  const code = String(error?.code ?? "");
  return code === "42703" || code === "42P01";
}

function isMissingCommentsTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "comments" does not exist');
}

function createSlugConflictError(message = "Slug already exists.") {
  const error = new Error(message);
  error.code = "SLUG_CONFLICT";
  return error;
}

function toLegacyUpsertPayload(input, status) {
  return {
    slug: input.slug,
    title: input.title,
    date: input.date,
    description: input.description,
    cover: input.cover,
    tags: input.tags,
    content: input.renderBody || input.content || "",
    status,
    publishedAt: status === "published" ? new Date().toISOString() : null,
  };
}

function parseJsonColumnValue(value) {
  const parsed = parseMaybeJson(value);
  return parsed == null ? null : parsed;
}

function toModel(row) {
  if (!row) return null;
  const contentFormat = normalizeContentFormat(row.content_format);
  const content = String(row.content ?? "");
  const renderBody = String(row.render_body ?? "").trim() || content;

  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    date: formatDate(row.date),
    description: row.description ?? "",
    cover: row.cover ?? "",
    tags: row.tags ?? [],
    status: row.status,
    content,
    contentFormat,
    contentJson: parseJsonColumnValue(row.content_json),
    renderBody,
    editorSource: normalizeEditorSource(row.editor_source),
    sourceRef: row.source_ref ?? null,
    sourceUpdatedAt: row.source_updated_at ?? null,
    latestRevisionId: row.latest_revision_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    publishedAt: row.published_at ?? null,
  };
}

async function upsertPostWithExtendedSchema(db, input, status) {
  const contentJsonString =
    input.contentJson == null ? null : JSON.stringify(input.contentJson);
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const result = await db.sql`
    INSERT INTO posts (
      slug, title, date, description, cover, tags, content,
      content_format, content_json, render_body, editor_source, source_ref, source_updated_at,
      status, updated_at, published_at
    )
    VALUES (
      ${input.slug}, ${input.title}, ${input.date}, ${input.description}, ${input.cover}, ${input.tags},
      ${input.content || input.renderBody || ""},
      ${input.contentFormat},
      ${contentJsonString}::jsonb,
      ${input.renderBody},
      ${input.editorSource},
      ${input.sourceRef},
      ${input.sourceUpdatedAt},
      ${status},
      NOW(),
      ${publishedAt}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      description = EXCLUDED.description,
      cover = EXCLUDED.cover,
      tags = EXCLUDED.tags,
      content = EXCLUDED.content,
      content_format = EXCLUDED.content_format,
      content_json = EXCLUDED.content_json,
      render_body = EXCLUDED.render_body,
      editor_source = EXCLUDED.editor_source,
      source_ref = EXCLUDED.source_ref,
      source_updated_at = EXCLUDED.source_updated_at,
      status = EXCLUDED.status,
      updated_at = NOW(),
      published_at = ${publishedAt}
    RETURNING *
  `;

  return toModel(result.rows[0]);
}

async function upsertPostLegacy(db, input, status) {
  const legacyPayload = toLegacyUpsertPayload(input, status);
  const result = await db.sql`
    INSERT INTO posts (slug, title, date, description, cover, tags, content, status, updated_at, published_at)
    VALUES (
      ${legacyPayload.slug},
      ${legacyPayload.title},
      ${legacyPayload.date},
      ${legacyPayload.description},
      ${legacyPayload.cover},
      ${legacyPayload.tags},
      ${legacyPayload.content},
      ${legacyPayload.status},
      NOW(),
      ${legacyPayload.publishedAt}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      description = EXCLUDED.description,
      cover = EXCLUDED.cover,
      tags = EXCLUDED.tags,
      content = EXCLUDED.content,
      status = EXCLUDED.status,
      updated_at = NOW(),
      published_at = ${legacyPayload.publishedAt}
    RETURNING *
  `;

  return toModel(result.rows[0]);
}

async function insertRevision(db, post, input, status, createdBy) {
  const contentJsonString =
    input.contentJson == null ? null : JSON.stringify(input.contentJson);

  const result = await db.sql`
    WITH next_revision AS (
      SELECT COALESCE(MAX(revision_no), 0) + 1 AS revision_no
      FROM post_revisions
      WHERE post_id = ${post.id}
    ),
    inserted AS (
      INSERT INTO post_revisions (
        post_id, revision_no, status, content_format, content_text, content_json, render_body,
        title, description, cover, tags, created_by
      )
      SELECT
        ${post.id},
        next_revision.revision_no,
        ${status},
        ${input.contentFormat},
        ${input.content || null},
        ${contentJsonString}::jsonb,
        ${input.renderBody || null},
        ${input.title},
        ${input.description},
        ${input.cover},
        ${input.tags},
        ${createdBy || null}
      FROM next_revision
      RETURNING id, revision_no
    )
    UPDATE posts
    SET latest_revision_id = inserted.id
    FROM inserted
    WHERE posts.id = ${post.id}
    RETURNING inserted.id AS revision_id, inserted.revision_no
  `;

  return {
    revisionId: result.rows[0]?.revision_id ?? null,
    revisionNo: result.rows[0]?.revision_no ?? null,
  };
}

async function maybeRenamePostSlug(db, originalSlug, nextSlug) {
  const safeOriginalSlug = normalizeOriginalSlug(originalSlug);
  if (!safeOriginalSlug || safeOriginalSlug === nextSlug) {
    return { renamedFrom: null };
  }

  const originalResult = await db.sql`
    SELECT id, slug
    FROM posts
    WHERE slug = ${safeOriginalSlug}
    LIMIT 1
  `;
  const originalPost = originalResult.rows[0];
  if (!originalPost) {
    return { renamedFrom: null };
  }

  const nextResult = await db.sql`
    SELECT id, slug
    FROM posts
    WHERE slug = ${nextSlug}
    LIMIT 1
  `;
  const existingNextPost = nextResult.rows[0];
  if (existingNextPost && Number(existingNextPost.id) !== Number(originalPost.id)) {
    throw createSlugConflictError("目标 slug 已存在，请更换后再保存。");
  }

  if (existingNextPost) {
    return { renamedFrom: null };
  }

  await db.sql`
    UPDATE posts
    SET slug = ${nextSlug}, updated_at = NOW()
    WHERE id = ${originalPost.id}
  `;

  try {
    await db.sql`
      UPDATE comments
      SET post_slug = ${nextSlug}
      WHERE post_slug = ${safeOriginalSlug}
    `;
  } catch (error) {
    if (!isLegacySchemaError(error) && !isMissingCommentsTableError(error)) {
      throw error;
    }
  }

  return { renamedFrom: safeOriginalSlug };
}

export function normalizePostInput(rawBody, options = {}) {
  const fallbackPrefix = options.fallbackSlugPrefix || "draft";
  const status = options.status || "draft";

  const title = String(rawBody?.title ?? "").trim() || "无题";
  const slugResult = normalizeSlug(rawBody?.slug, title, fallbackPrefix);
  if (slugResult.error) return { error: slugResult.error };

  const contentFormat = normalizeContentFormat(
    rawBody?.contentFormat ?? rawBody?.content_format ?? DEFAULT_CONTENT_FORMAT
  );
  const content = String(rawBody?.content ?? "");
  const contentJson =
    parseMaybeJson(rawBody?.contentJson ?? rawBody?.content_json) ?? null;
  const renderBodyRaw = String(rawBody?.renderBody ?? rawBody?.render_body ?? "").trim();
  const renderBody =
    renderBodyRaw ||
    buildRenderBody({
      contentFormat,
      content,
      contentJson,
    });

  const editorSource = normalizeEditorSource(
    rawBody?.editorSource ?? rawBody?.editor_source ?? DEFAULT_EDITOR_SOURCE
  );

  return {
    status,
    slug: slugResult.slug,
    title,
    date: normalizeDate(rawBody?.date),
    description: toNullableTrimmedText(rawBody?.description),
    cover: toNullableTrimmedText(rawBody?.cover),
    tags: parseTags(rawBody?.tags),
    content,
    contentFormat,
    contentJson,
    renderBody,
    editorSource,
    sourceRef: toNullableTrimmedText(rawBody?.sourceRef ?? rawBody?.source_ref),
    sourceUpdatedAt: normalizeSourceUpdatedAt(
      rawBody?.sourceUpdatedAt ?? rawBody?.source_updated_at
    ),
  };
}

export async function upsertPostContent({
  input,
  status = "draft",
  originalSlug,
  createdBy = EDITOR_SOURCES.INTERNAL,
  dbClient,
}) {
  const db = dbClient ?? requireDb();
  const renameResult = await maybeRenamePostSlug(db, originalSlug, input.slug);
  let post;

  try {
    post = await upsertPostWithExtendedSchema(db, input, status);
  } catch (error) {
    if (!isLegacySchemaError(error)) throw error;
    post = await upsertPostLegacy(db, input, status);
  }

  let revision = { revisionId: null, revisionNo: null };
  try {
    revision = await insertRevision(db, post, input, status, createdBy);
  } catch (error) {
    if (!isLegacySchemaError(error)) throw error;
  }

  return {
    ...post,
    renamedFrom: renameResult.renamedFrom,
    revisionId: revision.revisionId,
    revisionNo: revision.revisionNo,
  };
}

export function toApiPost(post) {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    description: post.description,
    cover: post.cover,
    tags: post.tags,
    status: post.status,
    content: post.content,
    contentFormat: post.contentFormat,
    contentJson: post.contentJson,
    renderBody: post.renderBody,
    editorSource: post.editorSource,
    sourceRef: post.sourceRef,
    sourceUpdatedAt: post.sourceUpdatedAt,
    latestRevisionId: post.latestRevisionId,
  };
}
