import ArgonShell from "@/src/components/argon/ArgonShell";
import { getSortedPostsData } from "@/src/lib/posts";
import {
  getResourceSections,
  getResourceTotal,
  RESOURCE_LIBRARY_INTRO,
} from "@/src/lib/resources.mjs";

export const metadata = {
  title: "资源库 | 象龟的水坑",
  description: "按 AI、开发、网络和效率场景整理的个人常用资源页。",
};

export default async function ResourcesPage() {
  const posts = await getSortedPostsData();
  const sections = getResourceSections();
  const total = getResourceTotal();

  return (
    <ArgonShell
      posts={posts}
      title={RESOURCE_LIBRARY_INTRO.title}
      subtitle={`共收录 ${total} 项资源，按场景整理，只保留我愿意公开推荐的那部分。`}
    >
      <section className="nh-resource-library" aria-label="资源库">
        <article className="nh-card nh-resource-intro">
          {RESOURCE_LIBRARY_INTRO.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        {sections.map((section) => (
          <section
            key={section.id}
            className="nh-resource-section"
            aria-labelledby={`resource-section-${section.id}`}
          >
            <header className="nh-section-head">
              <div>
                <h2 id={`resource-section-${section.id}`}>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <span className="nh-resource-count">{section.resources.length} 项精选</span>
            </header>

            <div className="nh-resource-grid">
              {section.resources.map((resource) => (
                <article key={resource.name} className="nh-card nh-resource-card">
                  <div className="nh-resource-card-head">
                    <div className="nh-resource-copy">
                      <h3>{resource.name}</h3>
                      <p>{resource.summary}</p>
                    </div>
                    <div className="nh-resource-tags" aria-label={`${resource.name} 标签`}>
                      {resource.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`nh-chip ${tag === "邀请链接" ? "is-referral" : ""}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="nh-resource-card-body">
                    <p className="nh-resource-kicker">推荐理由</p>
                    <p className="nh-resource-reason">{resource.reason}</p>
                    {resource.note ? (
                      <p className="nh-resource-note">{resource.note}</p>
                    ) : null}
                  </div>

                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="nh-section-link nh-resource-action"
                  >
                    {resource.actionLabel}
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </ArgonShell>
  );
}
