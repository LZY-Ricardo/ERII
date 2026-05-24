import Link from "next/link";
import ProjectCoverImage from "@/src/components/ProjectCoverImage";
import { groupProjectActions } from "@/src/lib/projectCardGroups";

function ProjectAction({ action, className = "" }) {
  const href = String(action?.href ?? "").trim();
  if (!href) return null;

  const combinedClass = `nh-project-link ${className}`.trim();

  if (action.external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={combinedClass}>
        {action.label}
      </a>
    );
  }

  return (
    <Link href={href} className={combinedClass}>
      {action.label}
    </Link>
  );
}

export default function ProjectCard({ project }) {
  const { liveAction, githubAction, otherActions } = groupProjectActions(project?.links);

  return (
    <article className="nh-project-card nh-card">
      <div className="nh-project-cover-wrap">
        <ProjectCoverImage src={project?.cover} alt={`${project?.name ?? "Project"} cover`} />

        <span className="nh-project-status" data-state={project?.state ?? "active"}>
          {project?.status ?? "更新中"}
        </span>

        {liveAction ? (
          liveAction.external ? (
            <a href={liveAction.href} target="_blank" rel="noreferrer" className="nh-project-live-badge">
              LIVE
            </a>
          ) : (
            <Link href={liveAction.href} className="nh-project-live-badge">
              LIVE
            </Link>
          )
        ) : null}
      </div>

      <div className="nh-project-body">
        <h3 className="nh-project-title">{project?.name}</h3>
        <p className="nh-project-tagline">{project?.tagline}</p>
        <p className="nh-project-summary">{project?.summary}</p>

        <div className="nh-project-tech">
          {(project?.tech ?? []).slice(0, 5).map((item) => (
            <span key={item} className="nh-chip">
              {item}
            </span>
          ))}
        </div>

        <div className="nh-project-actions">
          {liveAction ? (
            <ProjectAction action={{ ...liveAction, label: "在线体验" }} className="is-live" />
          ) : (
            <span className="nh-project-live-muted">暂未开放在线体验</span>
          )}
          {githubAction ? (
            <ProjectAction action={{ ...githubAction, label: "GitHub" }} className="is-github" />
          ) : null}
          {otherActions.map((action) => (
            <ProjectAction
              key={`${project.id}:${action.label}:${action.href}`}
              action={action}
              className="is-secondary"
            />
          ))}
        </div>
      </div>
    </article>
  );
}
