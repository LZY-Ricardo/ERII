import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db";
import { normalizeSlugParam } from "@/src/lib/slugParam";

function formatDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

const getPublishedPostsFromDb = unstable_cache(
  async () => {
    if (!db) return [];

    const result = await db.sql`
      SELECT slug, title, date, description, cover, tags
      FROM posts
      WHERE status = 'published'
      ORDER BY date DESC
    `;

    return result.rows.map((row) => ({
      slug: row.slug,
      frontmatter: {
        title: row.title,
        date: formatDate(row.date),
        description: row.description ?? "",
        cover: row.cover ?? "",
        tags: row.tags ?? [],
      },
    }));
  },
  ["posts:published"],
  { tags: ["posts"], revalidate: 60 }
);

function getPublishedPostFromDb(slug) {
  return unstable_cache(
    async () => {
      if (!db) return null;

      const result = await db.sql`
        SELECT slug, title, date, description, cover, tags, content
        FROM posts
        WHERE slug = ${slug} AND status = 'published'
        LIMIT 1
      `;

      const row = result.rows[0];
      if (!row) return null;

      return {
        slug: row.slug,
        frontmatter: {
          title: row.title,
          date: formatDate(row.date),
          description: row.description ?? "",
          cover: row.cover ?? "",
          tags: row.tags ?? [],
        },
        content: row.content,
      };
    },
    ["post:published", slug],
    { tags: [`post:${slug}`, "posts"], revalidate: 60 }
  )();
}

export async function getSortedPostsData() {
  const dbPosts = await getPublishedPostsFromDb();
  return dbPosts;
}

export async function getPostData(slug) {
  const normalizedSlug = normalizeSlugParam(slug);
  if (!normalizedSlug) return null;

  return getPublishedPostFromDb(normalizedSlug);
}
