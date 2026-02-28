import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";
import { filterPostsByTaxonomy, getCategoryThemeLabel } from "@/src/lib/postTaxonomy";

export default async function BlogIndexPage({ searchParams }) {
  const posts = await getSortedPostsData();
  const resolved = (await searchParams) ?? {};
  const category = typeof resolved.category === "string" ? resolved.category : "";
  const tag = typeof resolved.tag === "string" ? resolved.tag : "";

  const filteredPosts = filterPostsByTaxonomy(posts, { category, tag });
  const categoryLabel = getCategoryThemeLabel(category);

  const title = category
    ? `谱系： ${categoryLabel}${category && category !== categoryLabel ? `（${category}）` : ""}`
    : tag
      ? `印记： ${tag}`
      : "学院档案： 全部记录";

  const subtitle = category || tag
    ? `共检索到 ${filteredPosts.length} 份记录`
    : "卡塞尔的风从北方来，旧日与新火在同一页纸上交汇。";

  return (
    <ArgonShell posts={posts} title={title} subtitle={subtitle} activeCategory={category}>
      <section className="nh-post-masonry" aria-label="文章列表">
        {filteredPosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
