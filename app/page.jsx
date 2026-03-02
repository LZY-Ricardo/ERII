import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";

export default async function HomePage() {
  const posts = await getSortedPostsData();

  return (
    <ArgonShell posts={posts}>
      <section className="nh-post-masonry" aria-label="全部文章列表">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
