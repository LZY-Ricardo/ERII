import Link from "next/link";
import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";
import ProjectCard from "@/src/components/ProjectCard";
import { getFeaturedProjects } from "@/src/lib/projects";

const SITE_URL = "https://blog.sunandyu.top";

export const metadata = {
  title: "象龟的水坑 | 个人知识分享 - 前端、AI 与开发实践",
  description:
    "象龟的水坑是 Ricardo 的个人博客，分享前端开发、AI 应用、后端实践、个人项目与精选工具推荐，持续更新技术笔记与踩坑总结。",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "象龟的水坑 | 个人知识分享 - 前端、AI 与开发实践",
    description: "Ricardo 的个人博客，分享前端开发、AI 应用、后端实践、个人项目与精选工具推荐。",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "象龟的水坑",
      description: "Ricardo 的个人博客，分享前端开发、AI 应用、后端实践、个人项目与精选工具推荐。",
      inLanguage: "zh-CN",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Ricardo",
      url: SITE_URL,
    },
  ],
};

export default async function HomePage() {
  const posts = await getSortedPostsData();
  const featuredProjects = await getFeaturedProjects(3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArgonShell
        currentPath="/"
        posts={posts}
        title="每只象龟心中都有一处温暖的水坑"
        titleMode="hero"
        deployedProjects={featuredProjects}
      >
      <section className="nh-project-showcase" aria-label="项目精选">
        <header className="nh-section-head">
          <div>
            <h2>项目精选</h2>
            <p>展示我最近重点投入的前端、AI 与开发实践项目。</p>
          </div>
          <Link href="/projects" className="nh-section-link">
            查看全部
          </Link>
        </header>

        <div className="nh-project-grid is-home">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="nh-post-masonry" aria-label="全部文章列表">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
      </ArgonShell>
    </>
  );
}
