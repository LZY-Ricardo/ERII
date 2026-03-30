import ArgonShell from "@/src/components/argon/ArgonShell";
import { getSortedPostsData } from "@/src/lib/posts";

const SITE_URL = "https://blog.sunandyu.top";

export const metadata = {
  title: "关于本站",
  description:
    "象龟的水坑是 Ricardo 的个人博客，聚焦前端开发、AI 应用、后端实践与个人项目，记录真实的学习过程与踩坑总结。",
  keywords: ["关于博主", "Ricardo", "前端开发者", "AI 实践", "个人博客"],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: "profile",
    url: `${SITE_URL}/about`,
    title: "关于本站 | 象龟的水坑",
    description: "认识 Ricardo，了解象龟的水坑博客的内容方向与作者背景。",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "象龟的水坑是什么网站？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "象龟的水坑是 Ricardo 的个人技术博客，主要分享前端开发、AI 应用、后端实践、算法题解、个人项目与精选工具推荐，内容优先保持可复现和可落地。",
      },
    },
    {
      "@type": "Question",
      name: "这个博客主要写什么内容？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "内容方向集中在 React、Next.js、TypeScript、Node.js、Java、算法题解、AI 应用开发与 Agent 工作流。文章以学习笔记、项目复盘和踩坑总结为主，配合分类和标签方便快速检索。",
      },
    },
    {
      "@type": "Question",
      name: "博主 Ricardo 是谁？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ricardo 是一名关注前端、AI 与全栈开发的程序员，通过象龟的水坑博客持续记录和分享技术实践经验。",
      },
    },
    {
      "@type": "Question",
      name: "如何联系博主？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "可以通过博客侧栏中的联系方式与 Ricardo 交流，欢迎对前端、AI 和开发实践感兴趣的朋友互动。",
      },
    },
    {
      "@type": "Question",
      name: "博客有哪些工具和资源推荐？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "博客设有资源库页面，整理了 Ricardo 亲测推荐的 AI 工具、开发资源、效率工具与网络工具，只收录真正值得使用的内容，访问 /resources 查看。",
      },
    },
  ],
};

export default async function AboutPage() {
  const posts = await getSortedPostsData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ArgonShell posts={posts} title="关于本站" subtitle="一个持续更新的前端、AI 与开发学习记录站点。">
        <article className="nh-article nh-card">
          <div className="nh-article-content prose max-w-none prose-slate prose-headings:font-serif prose-strong:text-slate-800">
            <p>
              你好，我是 Ricardo。这个博客主要记录前端、AI、后端与算法方向的学习笔记、项目复盘与踩坑总结。
              站点采用清晰的分类与标签结构，方便快速查找具体主题。
            </p>
            <p>
              内容方向目前集中在 React / Next.js / TypeScript、Node / Java、算法题解、AI 应用开发与 Agent 工作流。
              文章会优先保持可复现和可落地，尽量减少空泛结论。
            </p>
            <p>
              如果你也在关注前端、AI 和开发实践，欢迎通过侧栏联系方式交流。后续会持续补充专题系列与实战案例。
            </p>

            <h2>常见问题</h2>

            <h3>这个博客主要写什么内容？</h3>
            <p>
              内容方向集中在 React、Next.js、TypeScript、Node.js、Java、算法题解、AI 应用开发与 Agent 工作流。
              文章以学习笔记、项目复盘和踩坑总结为主。
            </p>

            <h3>博客有哪些工具和资源推荐？</h3>
            <p>
              博客设有<a href="/resources">资源库页面</a>，整理了 Ricardo 亲测推荐的 AI 工具、开发资源、效率工具与网络工具，只收录真正值得使用的内容。
            </p>

            <h3>如何联系博主？</h3>
            <p>
              可以通过博客侧栏中的联系方式与 Ricardo 交流，欢迎对前端、AI 和开发实践感兴趣的朋友互动。
            </p>
          </div>
        </article>
      </ArgonShell>
    </>
  );
}
