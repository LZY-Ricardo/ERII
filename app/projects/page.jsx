import Link from "next/link";
import ArgonShell from "@/src/components/argon/ArgonShell";
import ProjectCard from "@/src/components/ProjectCard";
import { getSortedPostsData } from "@/src/lib/posts";
import { PROJECT_FOCUS, filterProjectsByFocus, getAllProjects } from "@/src/lib/projects";

export default async function ProjectsPage({ searchParams }) {
  const posts = await getSortedPostsData();
  const resolved = (await searchParams) ?? {};
  const focusRaw = typeof resolved.focus === "string" ? resolved.focus : "all";

  const isValidFocus = PROJECT_FOCUS.some((item) => item.value === focusRaw);
  const focus = isValidFocus ? focusRaw : "all";
  const focusLabel = PROJECT_FOCUS.find((item) => item.value === focus)?.label ?? "全部项目";

  const allProjects = getAllProjects();
  const projects = filterProjectsByFocus(allProjects, focus);

  const title = focus === "all" ? "项目仓库" : `${focusLabel} 项目`;
  const subtitle =
    focus === "all"
      ? `共收录 ${allProjects.length} 个项目，持续更新简介、技术栈与访问链接。`
      : `当前筛选：${focusLabel}，共 ${projects.length} 个项目。`;

  return (
    <ArgonShell posts={posts} title={title} subtitle={subtitle}>
      <section className="nh-project-hub" aria-label="项目列表">
        <div className="nh-project-filter">
          {PROJECT_FOCUS.map((item) => (
            <Link
              key={item.value}
              href={item.value === "all" ? "/projects" : `/projects?focus=${encodeURIComponent(item.value)}`}
              className={`nh-chip ${focus === item.value ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {projects.length ? (
          <div className="nh-project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <article className="nh-card nh-project-empty">
            <p>当前筛选暂无项目，稍后会继续补充。</p>
          </article>
        )}
      </section>
    </ArgonShell>
  );
}

