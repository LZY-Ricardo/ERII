import Header from "@/src/components/Header";
import PostCard from "@/src/components/PostCard";
import SecretTrigger from "@/src/components/SecretTrigger";
import { getSortedPostsData } from "@/src/lib/posts";

export default async function HomePage() {
  const posts = await getSortedPostsData();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <Header />

        <section className="mt-10 relative">
          <div className="absolute left-6 top-0 hidden h-[340px] w-32 select-none sm:block">
            <div className="relative h-full w-full">
              <div className="absolute bottom-4 left-0 top-3 w-[7px] bg-gradient-to-b from-transparent via-erii-red/10 to-transparent blur-md" />
              <div className="absolute bottom-4 left-0 top-3 w-[1px] bg-gradient-to-b from-transparent via-erii-red/75 to-transparent" />

              <p className="writing-mode-vertical absolute left-0 top-3 whitespace-nowrap font-serif text-xl font-black leading-[1.06] tracking-[0.28em] text-wafu-sumi opacity-95 md:text-2xl">
                我很喜欢这样的世界
              </p>

              <p className="writing-mode-vertical absolute left-[4rem] top-20 whitespace-nowrap font-serif text-lg font-medium leading-[1.1] tracking-[0.22em] text-erii-red opacity-85 md:text-xl">
                ..但世界不喜欢我
              </p>

              <div className="absolute -bottom-6 left-18 rotate-3 opacity-55 mix-blend-multiply">
                <div className="writing-mode-vertical rounded-sm border-2 border-erii-red/80 bg-erii-red/10 px-1 py-2 font-serif text-[10px] font-bold tracking-[0.18em] text-erii-red shadow-none">
                  上杉家主
                </div>
              </div>

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-erii-red/5 blur-3xl" />
            </div>
          </div>

          <div className="erii-diary-card relative flex min-h-[220px] flex-col gap-8 rounded-[2.5rem] border border-erii-red/10 bg-white/70 p-6 shadow-sm backdrop-blur sm:ml-36 sm:p-10">
            <p className="font-serif text-base tracking-[0.12em] text-wafu-sumi sm:hidden">
              我很喜欢这样的世界，但世界不喜欢我
            </p>
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
                className="erii-stamp absolute -bottom-8 right-6"
                aria-hidden="true"
              >
                绘梨衣
              </div>
            </div>
          </div>
        </section>

        <section className="relative mt-12">
          <h2 className="font-serif text-xl tracking-widest text-erii-ink sm:text-2xl">
            见闻录
          </h2>
          <span
            className="absolute right-0 top-0 writing-vertical font-serif text-[10px] leading-none tracking-widest text-erii-ink/60 sm:text-[11px]"
            style={{ textOrientation: "upright" }}
          >
            迎着阳光盛大逃亡的时光里
          </span>
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
