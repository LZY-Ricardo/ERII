import { requireDb } from "@/src/lib/db";
import { normalizeSlugParam } from "@/src/lib/slugParam";
import {
  DEFAULT_EDITOR_SOURCE,
  normalizeContentFormat,
  normalizeEditorSource,
} from "@/src/lib/content/constants";
import { parseMaybeJson } from "@/src/lib/content/renderPipeline";

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function isLegacySchemaError(error) {
  const code = String(error?.code ?? "");
  return code === "42703" || code === "42P01";
}

function isMissingWorkingDraftsTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "post_working_drafts" does not exist');
}

function toBasePostModel(row) {
  if (!row) return null;
  const content = String(row.content ?? "");

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
    contentFormat: normalizeContentFormat(row.content_format),
    contentJson: parseMaybeJson(row.content_json),
    renderBody: String(row.render_body ?? "").trim() || content,
    editorSource: normalizeEditorSource(row.editor_source ?? DEFAULT_EDITOR_SOURCE),
    sourceRef: row.source_ref ?? null,
    sourceUpdatedAt: row.source_updated_at ?? null,
    latestRevisionId: row.latest_revision_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    publishedAt: row.published_at ?? null,
  };
}

function toWorkingDraftModel(row, basePost) {
  if (!row || !basePost) return null;
  const content = String(row.content ?? "");

  return {
    id: basePost.id,
    slug: row.slug,
    title: row.title,
    date: formatDate(row.date),
    description: row.description ?? "",
    cover: row.cover ?? "",
    tags: row.tags ?? [],
    status: basePost.status,
    content,
    contentFormat: normalizeContentFormat(row.content_format),
    contentJson: parseMaybeJson(row.content_json),
    renderBody: String(row.render_body ?? "").trim() || content,
    editorSource: basePost.editorSource,
    sourceRef: basePost.sourceRef,
    sourceUpdatedAt: basePost.sourceUpdatedAt,
    latestRevisionId: basePost.latestRevisionId,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    publishedAt: basePost.publishedAt ?? null,
    originalSlug: basePost.slug,
    baseStatus: basePost.status,
    hasWorkingDraft: true,
    editorLookupSlug: basePost.slug,
    source: "working-draft",
  };
}

function toEditorPostModel(post, options = {}) {
  if (!post) return null;
  return {
    ...post,
    originalSlug: options.originalSlug ?? post.slug,
    baseStatus: options.baseStatus ?? post.status,
    hasWorkingDraft: Boolean(options.hasWorkingDraft),
    editorLookupSlug: options.editorLookupSlug ?? options.originalSlug ?? post.slug,
    source: options.source ?? "db",
  };
}

async function queryPostBySlug(db, slug) {
  try {
    const result = await db.sql`
      SELECT
        id, slug, title, date, description, cover, tags, content, status,
        content_format, content_json, render_body, editor_source, source_ref, source_updated_at,
        latest_revision_id, created_at, updated_at, published_at
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return toBasePostModel(result.rows[0]);
  } catch (error) {
    if (!isLegacySchemaError(error)) throw error;

    const result = await db.sql`
      SELECT id, slug, title, date, description, cover, tags, content, status, created_at, updated_at, published_at
      FROM posts
      WHERE slug = ${slug}
      LIMIT 1
    `;

    return toBasePostModel(result.rows[0]);
  }
}

async function queryWorkingDraftByPostId(db, postId) {
  try {
    const result = await db.sql`
      SELECT
        id, post_id, slug, title, date, description, cover, tags,
        content, content_format, content_json, render_body, created_at, updated_at
      FROM post_working_drafts
      WHERE post_id = ${postId}
      LIMIT 1
    `;
    return result.rows[0] ?? null;
  } catch (error) {
    if (isMissingWorkingDraftsTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getEditorPostBySlug(slug, dbClient) {
  const safeSlug = normalizeSlugParam(slug);
  if (!safeSlug) return null;

  const db = dbClient ?? requireDb();
  const basePost = await queryPostBySlug(db, safeSlug);
  if (!basePost) return null;

  if (basePost.status !== "published") {
    return toEditorPostModel(basePost, {
      originalSlug: basePost.slug,
      baseStatus: basePost.status,
      hasWorkingDraft: false,
      editorLookupSlug: basePost.slug,
      source: "db",
    });
  }

  const workingDraft = await queryWorkingDraftByPostId(db, basePost.id);
  if (!workingDraft) {
    return toEditorPostModel(basePost, {
      originalSlug: basePost.slug,
      baseStatus: basePost.status,
      hasWorkingDraft: false,
      editorLookupSlug: basePost.slug,
      source: "db",
    });
  }

  return toWorkingDraftModel(workingDraft, basePost);
}

export async function getPostBySlug(slug, dbClient) {
  const safeSlug = normalizeSlugParam(slug);
  if (!safeSlug) return null;
  const db = dbClient ?? requireDb();
  return queryPostBySlug(db, safeSlug);
}

export async function upsertPublishedPostWorkingDraft({
  publishedSlug,
  input,
  dbClient,
}) {
  const safeSlug = normalizeSlugParam(publishedSlug);
  if (!safeSlug) {
    const error = new Error("Invalid slug.");
    error.code = "INVALID_SLUG";
    throw error;
  }

  const db = dbClient ?? requireDb();
  const basePost = await queryPostBySlug(db, safeSlug);
  if (!basePost) {
    const error = new Error("Post not found.");
    error.code = "POST_NOT_FOUND";
    throw error;
  }

  if (basePost.status !== "published") {
    const error = new Error("Only published posts can save working drafts.");
    error.code = "POST_NOT_PUBLISHED";
    throw error;
  }

  const contentJsonString =
    input.contentJson == null ? null : JSON.stringify(input.contentJson);

  const result = await db.sql`
    INSERT INTO post_working_drafts (
      post_id, slug, title, date, description, cover, tags,
      content, content_format, content_json, render_body, updated_at
    )
    VALUES (
      ${basePost.id},
      ${input.slug},
      ${input.title},
      ${input.date},
      ${input.description},
      ${input.cover},
      ${input.tags},
      ${input.content || input.renderBody || ""},
      ${input.contentFormat},
      ${contentJsonString}::jsonb,
      ${input.renderBody},
      NOW()
    )
    ON CONFLICT (post_id) DO UPDATE SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      description = EXCLUDED.description,
      cover = EXCLUDED.cover,
      tags = EXCLUDED.tags,
      content = EXCLUDED.content,
      content_format = EXCLUDED.content_format,
      content_json = EXCLUDED.content_json,
      render_body = EXCLUDED.render_body,
      updated_at = NOW()
    RETURNING
      id, post_id, slug, title, date, description, cover, tags,
      content, content_format, content_json, render_body, created_at, updated_at
  `;

  return toWorkingDraftModel(result.rows[0], basePost);
}

export async function clearWorkingDraftByPostId(postId, dbClient) {
  if (!Number.isFinite(Number(postId)) || Number(postId) <= 0) return false;

  const db = dbClient ?? requireDb();

  try {
    const result = await db.sql`
      DELETE FROM post_working_drafts
      WHERE post_id = ${Number(postId)}
      RETURNING id
    `;
    return Boolean(result.rows[0]);
  } catch (error) {
    if (isMissingWorkingDraftsTableError(error)) {
      return false;
    }
    throw error;
  }
}

export function isMissingWorkingDraftTable(error) {
  return isMissingWorkingDraftsTableError(error);
}
