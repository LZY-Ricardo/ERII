import Image from "next/image";
import Link from "next/link";

function ProjectAction({ action }) {
  const href = String(action?.href ?? "").trim();
  if (!href) return null;

  if (action.external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="nh-project-link">
        {action.label}
      </a>
    );
  }

  return (
    <Link href={href} className="nh-project-link">
      {action.label}
    </Link>
  );
}

export default function ProjectCard({ project }) {
  const links = Array.isArray(project?.links) ? project.links.slice(0, 3) : [];

  return (
    <article className="nh-project-card nh-card">
      <div className="nh-project-cover-wrap">
        {project?.cover ? (
          <Image
            src={project.cover}
            alt={`${project.name} 封面`}
            width={960}
            height={540}
            className="nh-project-cover"
          />
        ) : (
          <span className="nh-project-cover nh-project-cover-fallback" aria-hidden="true" />
        )}

        <span className="nh-project-status" data-state={project?.state ?? "active"}>
          {project?.status ?? "持续更新"}
        </span>
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

        {links.length ? (
          <div className="nh-project-links">
            {links.map((action) => (
              <ProjectAction key={`${project.id}:${action.label}:${action.href}`} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

