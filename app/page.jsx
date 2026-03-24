import Link from "next/link";
import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";
import ProjectCard from "@/src/components/ProjectCard";
import { getFeaturedProjects } from "@/src/lib/projects";
import { TrendingList } from "@/src/components/TrendingCard";

async function getTrendingRepos() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3239";
    const res = await fetch(`${baseUrl}/api/trending?period=weekly`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.repos || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const posts = await getSortedPostsData();
  const featuredProjects = await getFeaturedProjects(3);
  const trendingRepos = await getTrendingRepos();

  return (
    <ArgonShell
      posts={posts}
      title="每只象龟心中都有一处温暖的水坑"
      subtitle="Ricardo的技术日志"
      titleMode="hero"
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

      {trendingRepos.length > 0 && (
        <section className="nh-trending-section" aria-label="GitHub 热点项目">
          <header className="nh-section-head">
            <div>
              <h2>GitHub 热点项目</h2>
              <p>本周 GitHub 上最受欢迎的开源项目 TOP 5。</p>
            </div>
            <a
              href="https://github.com/trending"
              target="_blank"
              rel="noreferrer"
              className="nh-section-link"
            >
              查看更多
            </a>
          </header>

          <TrendingList repos={trendingRepos} period="weekly" />
        </section>
      )}

      <section className="nh-post-masonry" aria-label="全部文章列表">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
