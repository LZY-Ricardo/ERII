import ArgonShell from "@/src/components/argon/ArgonShell";
import { getSortedPostsData } from "@/src/lib/posts";

export default async function AboutPage() {
  const posts = await getSortedPostsData();

  return (
    <ArgonShell posts={posts} title="关于档案馆" subtitle="写给每一位仍在追逐光的人。">
      <article className="nh-article nh-card">
        <div className="nh-article-content prose max-w-none prose-slate prose-headings:font-serif prose-strong:text-slate-800">
          <p>
            ERII 是一个以龙族阅读体验为灵感的个人博客。本站保持了 Argon 风格的稳定结构，
            同时将文案语义、色彩和信息组织替换为“卡塞尔档案馆”叙事。
          </p>
          <p>
            这里会收录章节感想、角色线索、世界观标注和开发实践。你可以把它当作一座长期更新的私人资料库，
            也是一份持续扩展的阅读地图。
          </p>
          <p>
            下一步会继续完善角色关系线、章节时间轴和龙文关键词检索。
          </p>
        </div>
      </article>
    </ArgonShell>
  );
}
