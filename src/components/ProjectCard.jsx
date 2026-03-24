import Image from "next/image";
import Link from "next/link";

function isGitHubAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  const label = String(action?.label ?? "").trim().toLowerCase();
  return href.includes("github.com") || label.includes("github");
}

function isLiveAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  if (/^https?:\/\//.test(href) && !isGitHubAction(action)) return true;

  const label = String(action?.label ?? "").trim().toLowerCase();
  return /live|preview|demo|在线|预览|体验/.test(label);
}

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
  const links = Array.isArray(project?.links) ? project.links.slice(0, 3) : [];
  const liveAction = links.find((item) => isLiveAction(item)) ?? null;
  const githubAction = links.find((item) => isGitHubAction(item)) ?? null;
  const otherActions = links.filter((item) => item !== liveAction && item !== githubAction);

  return (
    <article className="nh-project-card nh-card">
      <div className="nh-project-cover-wrap">
        {project?.cover ? (
          <Image
            src={project.cover}
            alt={`${project.name} cover`}
            width={960}
            height={540}
            className="nh-project-cover"
          />
        ) : (
          <span className="nh-project-cover nh-project-cover-fallback" aria-hidden="true" />
        )}

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
