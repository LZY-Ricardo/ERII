import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db";
import { normalizeSlugParam } from "@/src/lib/slugParam";

const postsDirectory = path.join(process.cwd(), "content");

function safeReadFsPosts() {
  try {
    return fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".mdx"));
  } catch {
    return [];
  }
}

function getSortedPostsDataFs() {
  const fileNames = safeReadFsPosts();

  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      frontmatter: data,
    };
  });

  return allPostsData.sort((a, b) => {
    if (a.frontmatter.date < b.frontmatter.date) return 1;
    if (a.frontmatter.date > b.frontmatter.date) return -1;
    return 0;
  });
}

function getPostDataFs(slug) {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data,
    content,
  };
}

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
  const fsPosts = getSortedPostsDataFs();
  const dbPosts = await getPublishedPostsFromDb();

  const bySlug = new Map();
  for (const post of fsPosts) bySlug.set(post.slug, post);
  for (const post of dbPosts) bySlug.set(post.slug, post);

  return Array.from(bySlug.values()).sort((a, b) => {
    if (a.frontmatter.date < b.frontmatter.date) return 1;
    if (a.frontmatter.date > b.frontmatter.date) return -1;
    return 0;
  });
}

export async function getPostData(slug) {
  const normalizedSlug = normalizeSlugParam(slug);
  if (!normalizedSlug) return null;

  const dbPost = await getPublishedPostFromDb(normalizedSlug);
  if (dbPost) return dbPost;

  try {
    return getPostDataFs(normalizedSlug);
  } catch {
    return null;
  }
}
