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

        <section className="mt-10 rounded-3xl border border-wafu-sumi/10 bg-wafu-paper/70 p-8 shadow-sm backdrop-blur">
          <h1 className="font-serif text-4xl text-wafu-sumi">
            文章{" "}
            <span className="ml-2 align-middle font-sans text-xs tracking-[0.35em] text-wafu-sumi/55">
              記事
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-wafu-sumi/70">
            短短的笔记，柔软的字句，每一页都系着一根红丝带。
          </p>
          <div className="my-6 border-t border-dashed border-wafu-sumi/15" />
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
