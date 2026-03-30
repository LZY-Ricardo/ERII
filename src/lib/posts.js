import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db";
import { normalizeSlugParam } from "@/src/lib/slugParam";

let hasWarnedMissingPostsTable = false;

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseMaybeJson(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function isMissingPostsTableError(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" && message.includes('relation "posts" does not exist');
}

function isMissingColumnError(error) {
  return String(error?.code ?? "") === "42703";
}

function warnMissingPostsTableOnce(error) {
  if (hasWarnedMissingPostsTable) return;
  hasWarnedMissingPostsTable = true;
  console.warn('[posts] relation "posts" does not exist, fallback to empty list.', error);
}

function mapListRow(row) {
  return {
    slug: row.slug,
    commentCount: Number(row.comment_count ?? 0),
    frontmatter: {
      title: row.title,
      date: formatDate(row.date),
      description: row.description ?? "",
      cover: row.cover ?? "",
      tags: row.tags ?? [],
    },
  };
}

function mapDetailRow(row) {
  const legacyContent = String(row.content ?? "");
  const renderBody = String(row.render_body ?? "").trim() || legacyContent;

  return {
    slug: row.slug,
    commentCount: Number(row.comment_count ?? 0),
    frontmatter: {
      title: row.title,
      date: formatDate(row.date),
      updatedAt: formatDate(row.updated_at),
      description: row.description ?? "",
      cover: row.cover ?? "",
      tags: row.tags ?? [],
    },
    content: legacyContent,
    renderBody,
    contentFormat: row.content_format ?? "mdx",
    contentJson: parseMaybeJson(row.content_json),
  };
}

const getPublishedPostsFromDb = unstable_cache(
  async () => {
    if (!db) return [];

    let result;
    try {
      result = await db.sql`
        SELECT
          p.slug,
          p.title,
          p.date,
          p.description,
          p.cover,
          p.tags,
          COALESCE(cc.comment_count, 0)::int AS comment_count
        FROM posts p
        LEFT JOIN (
          SELECT post_slug, COUNT(*)::int AS comment_count
          FROM comments
          WHERE status = 'approved'
          GROUP BY post_slug
        ) cc ON cc.post_slug = p.slug
        WHERE p.status = 'published'
        ORDER BY p.date DESC
      `;
    } catch (error) {
      if (isMissingPostsTableError(error)) {
        warnMissingPostsTableOnce(error);
        return [];
      }
      const isMissingCommentsTable =
        String(error?.code ?? "") === "42P01" &&
        String(error?.message ?? "").toLowerCase().includes('relation "comments" does not exist');
      if (isMissingCommentsTable) {
        result = await db.sql`
          SELECT slug, title, date, description, cover, tags, 0::int AS comment_count
          FROM posts
          WHERE status = 'published'
          ORDER BY date DESC
        `;
        return result.rows.map(mapListRow);
      }
      throw error;
    }

    return result.rows.map(mapListRow);
  },
  ["posts:published"],
  { tags: ["posts"], revalidate: 60 }
);

function getPublishedPostFromDb(slug) {
  return unstable_cache(
    async () => {
      if (!db) return null;

      let result;
      try {
        result = await db.sql`
          SELECT
            p.slug,
            p.title,
            p.date,
            p.updated_at,
            p.description,
            p.cover,
            p.tags,
            p.content,
            p.content_format,
            p.content_json,
            p.render_body,
            COALESCE(cc.comment_count, 0)::int AS comment_count
          FROM posts p
          LEFT JOIN (
            SELECT post_slug, COUNT(*)::int AS comment_count
            FROM comments
            WHERE status = 'approved'
            GROUP BY post_slug
          ) cc ON cc.post_slug = p.slug
          WHERE p.slug = ${slug} AND p.status = 'published'
          LIMIT 1
        `;
      } catch (error) {
        if (isMissingPostsTableError(error)) {
          warnMissingPostsTableOnce(error);
          return null;
        }
        const isMissingCommentsTable =
          String(error?.code ?? "") === "42P01" &&
          String(error?.message ?? "").toLowerCase().includes('relation "comments" does not exist');
        if (isMissingCommentsTable) {
          result = await db.sql`
            SELECT slug, title, date, description, cover, tags, content, content_format, content_json, render_body, 0::int AS comment_count
            FROM posts
            WHERE slug = ${slug} AND status = 'published'
            LIMIT 1
          `;
          const row = result.rows[0];
          if (!row) return null;
          return mapDetailRow(row);
        }
        if (isMissingColumnError(error)) {
          result = await db.sql`
            SELECT slug, title, date, description, cover, tags, content, 0::int AS comment_count
            FROM posts
            WHERE slug = ${slug} AND status = 'published'
            LIMIT 1
          `;
        } else {
          throw error;
        }
      }

      const row = result.rows[0];
      if (!row) return null;

      return mapDetailRow(row);
    },
    ["post:published", slug],
    { tags: [`post:${slug}`, "posts"], revalidate: 60 }
  )();
}

export async function getSortedPostsData() {
  return getPublishedPostsFromDb();
}

export async function getPostData(slug) {
  const normalizedSlug = normalizeSlugParam(slug);
  if (!normalizedSlug) return null;
  return getPublishedPostFromDb(normalizedSlug);
}
