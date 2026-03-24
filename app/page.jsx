import Link from "next/link";
import ArgonShell from "@/src/components/argon/ArgonShell";
import PostCard from "@/src/components/PostCard";
import { getSortedPostsData } from "@/src/lib/posts";
import ProjectCard from "@/src/components/ProjectCard";
import { getFeaturedProjects } from "@/src/lib/projects";

export default async function HomePage() {
  const posts = await getSortedPostsData();
  const featuredProjects = await getFeaturedProjects(3);

  return (
    <ArgonShell
      posts={posts}
      title="每只象龟心中都有一处温暖的水坑"
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

      <section className="nh-post-masonry" aria-label="全部文章列表">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </ArgonShell>
  );
}
