import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";
import { filterPostsByTaxonomy, getCategoryThemeLabel } from "@/src/lib/postTaxonomy";

export default async function BlogIndexPage({ searchParams }) {
  const posts = await getSortedPostsData();
  const resolved = (await searchParams) ?? {};
  const category = typeof resolved.category === "string" ? resolved.category : "";
  const tag = typeof resolved.tag === "string" ? resolved.tag : "";
  const topic = typeof resolved.topic === "string" ? resolved.topic : "";

  const filteredPosts = filterPostsByTaxonomy(posts, { category, tag, topic });
  const categoryLabel = getCategoryThemeLabel(category);

  const title = topic === "tech"
    ? "技术文章：前端与 AI"
    : category
      ? `分类：${categoryLabel}${category && category !== categoryLabel ? `（${category}）` : ""}`
      : tag
        ? `标签：${tag}`
        : "全部文章";

  const subtitle = topic === "tech"
    ? `已筛选前端与 AI 相关内容，共 ${filteredPosts.length} 篇`
    : category || tag
      ? `共找到 ${filteredPosts.length} 篇文章`
      : `共收录 ${filteredPosts.length} 篇文章，按分类和标签可快速筛选。`;

  return (
    <ArgonShell
      posts={posts}
      title={title}
      subtitle={subtitle}
      activeCategory={category}
      activeTag={tag}
      activeTopic={topic}
    >
      <section className="nh-post-masonry" aria-label="文章列表">
        {filteredPosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
