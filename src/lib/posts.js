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
    frontmatter: {
      title: row.title,
      date: formatDate(row.date),
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
        SELECT slug, title, date, description, cover, tags
        FROM posts
        WHERE status = 'published'
        ORDER BY date DESC
      `;
    } catch (error) {
      if (isMissingPostsTableError(error)) {
        warnMissingPostsTableOnce(error);
        return [];
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
          SELECT slug, title, date, description, cover, tags, content, content_format, content_json, render_body
          FROM posts
          WHERE slug = ${slug} AND status = 'published'
          LIMIT 1
        `;
      } catch (error) {
        if (isMissingPostsTableError(error)) {
          warnMissingPostsTableOnce(error);
          return null;
        }
        if (isMissingColumnError(error)) {
          result = await db.sql`
            SELECT slug, title, date, description, cover, tags, content
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

