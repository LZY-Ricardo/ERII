import Header from "@/src/components/Header";
import PostCard from "@/src/components/PostCard";
import SecretTrigger from "@/src/components/SecretTrigger";
import { getSortedPostsData } from "@/src/lib/posts";

export default function HomePage() {
  const posts = getSortedPostsData();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <Header />

        <section className="mt-10">
          <div className="erii-diary-card relative flex min-h-[220px] flex-col gap-8 rounded-[2.5rem] border border-erii-red/10 bg-white/70 p-6 shadow-sm backdrop-blur sm:flex-row sm:gap-10 sm:p-10">
            <h1
              className="erii-scribble-vertical shrink-0 font-serif text-xl text-erii-ink sm:text-3xl"
              style={{ writingMode: "vertical-rl", textOrientation: "upright" }}
            >
              我很喜欢这样的世界，但世界不喜欢我
            </h1>

            <div className="relative flex-1">
              <div className="flex gap-6">
                <div className="flex-1 space-y-4 font-hand text-erii-ink">
                  <div className="erii-diary-entry translate-x-1 rotate-[-0.6deg]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-erii-ink/60">
                        04.24
                      </span>
                      <span className="text-sm text-erii-ink/75">
                        东京天空树
                      </span>
                      <span className="text-erii-ink/45" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2v20" />
                          <path d="M9 6h6" />
                          <path d="M10 10h4" />
                          <path d="M8.5 20h7" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-1 text-base leading-relaxed">
                      和 Sakura 去东京天空树，世界上最暖和的地方在天空树的顶上。
                    </p>
                  </div>

                  <div className="erii-diary-entry translate-x-6 translate-y-1 rotate-[0.8deg]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-erii-ink/60">
                        04.25
                      </span>
                      <span className="text-sm text-erii-ink/75">迪士尼</span>
                      <span className="text-erii-ink/45" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="13" r="5" />
                          <circle cx="8.5" cy="8.5" r="2.2" />
                          <circle cx="15.5" cy="8.5" r="2.2" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-1 text-base leading-relaxed">
                      和 Sakura 去迪士尼，鬼屋很可怕，但是有 Sakura 在，所以不可怕。
                    </p>
                  </div>

                  <div className="erii-diary-entry translate-x-2 translate-y-2 rotate-[-0.4deg]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-erii-ink/60">
                        04.26
                      </span>
                      <span className="text-sm text-erii-ink/75">明治神宫</span>
                      <span className="text-erii-ink/45" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 7h16" />
                          <path d="M6.5 7v13" />
                          <path d="M17.5 7v13" />
                          <path d="M9 7l3 4 3-4" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-1 text-base leading-relaxed">
                      和 Sakura 去明治神宫，有人在那里举办婚礼。
                    </p>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center sm:flex">
                  <p
                    className="writing-vertical font-serif text-xl text-wafu-shu sm:text-2xl"
                    style={{ textOrientation: "upright" }}
                  >
                    Sakura 最好了。
                  </p>
                </div>
              </div>
              <p className="mt-5 font-serif text-lg text-wafu-shu sm:hidden">
                Sakura 最好了。
              </p>

              <div
                className="erii-washi-tape absolute -left-6 -top-5 h-10 w-44 rotate-[-6deg]"
                aria-hidden="true"
              />
              <div
                className="erii-stamp absolute bottom-4 right-6"
                aria-hidden="true"
              >
                绘梨衣
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-start justify-between">
            <h2 className="font-serif text-xl tracking-widest text-erii-ink sm:text-2xl">
              见闻录
            </h2>
            <span
              className="writing-vertical font-serif text-[10px] leading-none tracking-widest text-erii-ink/60 sm:text-[11px]"
              style={{ textOrientation: "upright" }}
            >
              迎着阳光盛大逃亡的时光里
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
