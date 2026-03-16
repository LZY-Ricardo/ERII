import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeSearchKeyword(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tokenizeSearchKeyword(value) {
  const normalized = normalizeSearchKeyword(value);
  if (!normalized) return [];
  return normalized
    .toLowerCase()
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreField(value, token, base, { exactBonus = 0, prefixBonus = 0 } = {}) {
  if (!value || !token || !value.includes(token)) return 0;

  let score = base;
  if (value === token) score += exactBonus;
  else if (value.startsWith(token)) score += prefixBonus;
  return score;
}

function getPostSearchDocument(post) {
  const category = inferCategoryFromPost(post);

  return {
    title: String(post?.frontmatter?.title ?? ""),
    description: String(post?.frontmatter?.description ?? ""),
    slug: String(post?.slug ?? ""),
    tags: Array.isArray(post?.frontmatter?.tags)
      ? post.frontmatter.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    category,
    categoryLabel: getCategoryThemeLabel(category),
    date: String(post?.frontmatter?.date ?? ""),
  };
}

export function searchPosts(posts, keyword, { limit } = {}) {
  const normalizedKeyword = normalizeSearchKeyword(keyword);
  const tokens = tokenizeSearchKeyword(normalizedKeyword);
  if (!tokens.length) return [];

  const normalizedFullKeyword = normalizedKeyword.toLowerCase();

  const ranked = (posts ?? [])
    .map((post, index) => {
      const doc = getPostSearchDocument(post);
      const title = normalizeText(doc.title);
      const description = normalizeText(doc.description);
      const slug = normalizeText(doc.slug);
      const category = normalizeText(doc.categoryLabel || doc.category);
      const tags = doc.tags.map((tag) => normalizeText(tag));
      const haystack = [title, slug, description, category, ...tags].join(" ");

      if (!tokens.every((token) => haystack.includes(token))) {
        return null;
      }

      let score = 0;

      if (title.includes(normalizedFullKeyword)) score += 24;
      if (slug.includes(normalizedFullKeyword)) score += 20;
      if (tags.some((tag) => tag.includes(normalizedFullKeyword))) score += 18;
      if (description.includes(normalizedFullKeyword)) score += 12;
      if (category.includes(normalizedFullKeyword)) score += 10;

      for (const token of tokens) {
        score += scoreField(title, token, 14, { exactBonus: 10, prefixBonus: 4 });
        score += scoreField(slug, token, 12, { exactBonus: 10, prefixBonus: 4 });
        score += scoreField(description, token, 6, { prefixBonus: 2 });
        score += scoreField(category, token, 8, { exactBonus: 6 });

        for (const tag of tags) {
          score += scoreField(tag, token, 9, { exactBonus: 8, prefixBonus: 3 });
        }
      }

      const matchedTags = doc.tags.filter((tag) =>
        tokens.some((token) => normalizeText(tag).includes(token))
      );

      return {
        post,
        score,
        index,
        matchedTags,
        category: doc.category,
        categoryLabel: doc.categoryLabel,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

  if (typeof limit === "number" && limit > 0) {
    return ranked.slice(0, limit);
  }

  return ranked;
}

export function buildBlogSearchHref(keyword) {
  const normalized = normalizeSearchKeyword(keyword);
  if (!normalized) return "/blog";
  return `/blog?q=${encodeURIComponent(normalized)}`;
}
