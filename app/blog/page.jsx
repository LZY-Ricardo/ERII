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
      ? `谱系： ${categoryLabel}${category && category !== categoryLabel ? `（${category}）` : ""}`
      : tag
        ? `印记： ${tag}`
        : "学院档案： 全部记录";

  const subtitle = topic === "tech"
    ? `聚合前端与 AI 相关内容，共 ${filteredPosts.length} 篇`
    : category || tag
      ? `共检索到 ${filteredPosts.length} 份记录`
      : "卡塞尔的风从北方来，旧日与新火在同一页纸上交汇。";

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
