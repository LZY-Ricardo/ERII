import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";

export default async function HomePage() {
  const posts = await getSortedPostsData();

  return (
    <ArgonShell
      posts={posts}
      title="每只象龟心中都有一处温暖的水坑"
      subtitle="Ricardo的技术日志"
      titleMode="hero"
    >
      <section className="nh-post-masonry" aria-label="全部文章列表">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
