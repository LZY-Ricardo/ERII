import ArgonShell from "@/src/components/argon/ArgonShell";
import { getSortedPostsData } from "@/src/lib/posts";

export default async function AboutPage() {
  const posts = await getSortedPostsData();

  return (
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
        </div>
      </article>
    </ArgonShell>
  );
}
