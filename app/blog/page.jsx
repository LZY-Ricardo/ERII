import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { normalizeSearchKeyword, searchPosts } from "@/src/lib/postSearch";
import { getSortedPostsData } from "@/src/lib/posts";
import { filterPostsByTaxonomy, getCategoryThemeLabel } from "@/src/lib/postTaxonomy";

const SITE_URL = "https://blog.sunandyu.top";

export async function generateMetadata({ searchParams }) {
  const resolved = (await searchParams) ?? {};
  const category = typeof resolved.category === "string" ? resolved.category : "";
  const tag = typeof resolved.tag === "string" ? resolved.tag : "";
  const topic = typeof resolved.topic === "string" ? resolved.topic : "";
  const keyword = normalizeSearchKeyword(typeof resolved.q === "string" ? resolved.q : "");

  const categoryLabel = getCategoryThemeLabel(category);
  const canonicalUrl = `${SITE_URL}/blog`;

  if (keyword) {
    return {
      title: `搜索：${keyword}`,
      robots: { index: false },
    };
  }

  if (topic === "tech") {
    return {
      title: "技术内容：前端 / AI / 后端 / 算法",
      description: "浏览象龟的水坑全部技术向文章，涵盖前端、AI、后端与算法方向，持续更新。",
      alternates: { canonical: `${canonicalUrl}?topic=tech` },
    };
  }

  if (category) {
    return {
      title: categoryLabel,
      description: `浏览象龟的水坑「${categoryLabel}」分类下的全部文章。`,
      alternates: { canonical: `${canonicalUrl}?category=${encodeURIComponent(category)}` },
    };
  }

  if (tag) {
    return {
      title: `标签：${tag}`,
      description: `浏览象龟的水坑标签「${tag}」下的全部文章。`,
      alternates: { canonical: `${canonicalUrl}?tag=${encodeURIComponent(tag)}` },
    };
  }

  return {
    title: "全部文章",
    description:
      "浏览象龟的水坑全部文章，涵盖前端开发、AI 应用、后端实践与工具推荐，按分类和标签快速筛选。",
    keywords: ["前端博客", "技术文章", "AI 实践", "开发笔记", "工具推荐"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: "全部文章 | 象龟的水坑",
      description: "浏览 Ricardo 的全部技术博客文章，涵盖前端、AI、后端与工具推荐。",
    },
  };
}

export default async function BlogIndexPage({ searchParams }) {
  const posts = await getSortedPostsData();
  const resolved = (await searchParams) ?? {};
  const category = typeof resolved.category === "string" ? resolved.category : "";
  const tag = typeof resolved.tag === "string" ? resolved.tag : "";
  const topic = typeof resolved.topic === "string" ? resolved.topic : "";
  const keyword = normalizeSearchKeyword(typeof resolved.q === "string" ? resolved.q : "");

  const scopedPosts = filterPostsByTaxonomy(posts, { category, tag, topic });
  const filteredPosts = keyword
    ? searchPosts(scopedPosts, keyword).map((item) => item.post)
    : scopedPosts;
  const categoryLabel = getCategoryThemeLabel(category);

  const title = keyword
    ? `搜索：${keyword}`
    : topic === "tech"
      ? "技术内容：前端 / AI / 后端 / 算法"
      : category
        ? `分类：${categoryLabel}${category && category !== categoryLabel ? `（${category}）` : ""}`
        : tag
          ? `标签：${tag}`
          : "全部文章";

  const searchScopeLabel = topic === "tech"
    ? "技术内容"
    : category
      ? `分类 ${categoryLabel}`
      : tag
        ? `标签 ${tag}`
        : "全站内容";

  const subtitle = keyword
    ? `在${searchScopeLabel}中找到 ${filteredPosts.length} 篇相关文章。`
    : topic === "tech"
      ? `已筛选技术向内容，共 ${filteredPosts.length} 篇`
      : category || tag
        ? `共找到 ${filteredPosts.length} 篇文章`
        : `共收录 ${filteredPosts.length} 篇文章，按分类和标签可快速筛选。`;

  return (
    <ArgonShell
      currentPath="/blog"
      posts={posts}
      title={title}
      subtitle={subtitle}
      activeCategory={category}
      activeTag={tag}
      activeTopic={topic}
      activeSearchQuery={keyword}
    >
      {filteredPosts.length ? (
        <section className="nh-post-masonry" aria-label="文章列表">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      ) : (
        <article className="nh-card nh-search-empty">
          <p>{keyword ? `没有找到与“${keyword}”相关的文章。` : "当前筛选下暂无文章。"}</p>
          <p>可以试试更短的关键词，或者切换分类、标签后再搜索。</p>
        </article>
      )}
    </ArgonShell>
  );
}
