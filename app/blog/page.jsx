import Header from "@/src/components/Header";
import PostCard from "@/src/components/PostCard";
import SecretTrigger from "@/src/components/SecretTrigger";
import { getSortedPostsData } from "@/src/lib/posts";

export default function BlogIndexPage() {
  const posts = getSortedPostsData();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <Header />

        <section className="mt-10 rounded-3xl border border-erii-red/10 bg-white/70 p-8 shadow-sm">
          <h1 className="font-hand text-4xl text-erii-ink">文章</h1>
          <p className="mt-3 max-w-2xl text-base text-erii-ink/70">
            短短的笔记，柔软的字句，每一页都系着一根红丝带。
          </p>
          <div className="my-6 border-t border-dashed border-erii-red/30" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </div>

      <SecretTrigger />
    </div>
  );
}
