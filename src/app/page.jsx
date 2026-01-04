import Header from "../components/Header";
import PostCard from "../components/PostCard";
import SecretTrigger from "../components/SecretTrigger";
import { getSortedPostsData } from "../lib/posts";

export default function HomePage() {
  const posts = getSortedPostsData();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <Header />

        <section className="mt-10 rounded-[2.5rem] border border-erii-red/10 bg-white/70 p-10 shadow-sm backdrop-blur">
          <p className="text-xs font-hand uppercase tracking-[0.35em] text-erii-red/70">
            绘梨衣的写字板
          </p>
          <h1 className="erii-scribble mt-6 font-hand text-5xl text-erii-ink sm:text-6xl">
            世界是温柔的
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-erii-ink/80">
            我把最柔软的字句放在这里，像把压花夹在书页之间。
          </p>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-hand text-erii-ink">最新笔记</h2>
            <span className="text-xs font-hand text-erii-ink/60">
              写在安静的午后
            </span>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
