import Link from "next/link";
import RightbarArticleCatalog from "@/src/components/argon/RightbarArticleCatalog";
import RightbarContentTabs from "@/src/components/argon/RightbarContentTabs";
import RightbarProfileSettings from "@/src/components/argon/RightbarProfileSettings";
import RightbarRecentComments from "@/src/components/argon/RightbarRecentComments";
import RightbarTrendingWidget from "@/src/components/argon/RightbarTrendingWidget";
import {
  getCategoryThemeLabel,
  inferCategoryFromPost,
  POST_CATEGORY_DISPLAY_ORDER,
} from "@/src/lib/postTaxonomy";

function isGitHubAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  const label = String(action?.label ?? "").trim().toLowerCase();
  return href.includes("github.com") || label.includes("github");
}

function isLiveAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  if (/^https?:\/\//.test(href) && !isGitHubAction(action)) return true;

  const label = String(action?.label ?? "").trim().toLowerCase();
  return /live|preview|demo|在线|预览|体验/i.test(label);
}

function normalizeUrl(value) {
  const href = String(value ?? "").trim();
  return href ? href : "";
}

function collectCategories(posts) {
  const counts = new Map();

  for (const post of posts) {
    const key = inferCategoryFromPost(post);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return POST_CATEGORY_DISPLAY_ORDER.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
    displayLabel: getCategoryThemeLabel(label),
  })).filter((item) => item.count > 0);
}

function collectTags(posts) {
  const counts = new Map();

  for (const post of posts) {
    const tags = post?.frontmatter?.tags ?? [];
    for (const tag of tags) {
      const key = String(tag).trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([label, count]) => ({ label, count }));
}

function collectOnlineProjects(deployedProjects) {
  return (Array.isArray(deployedProjects) ? deployedProjects : [])
    .map((project) => {
      const links = Array.isArray(project?.links) ? project.links : [];
      const liveAction = links.find((item) => isLiveAction(item)) ?? null;
      const liveUrl = normalizeUrl(liveAction?.href);
      if (!liveUrl) return null;

      return {
        id: String(project?.id ?? project?.name ?? liveUrl),
        name: String(project?.name ?? ""),
        liveUrl,
      };
    })
    .filter(Boolean);
}

function WidgetFrame({ title, children, className = "", titleExtra = null }) {
  return (
    <section className={`nh-widget nh-card ${className}`.trim()}>
      <div className="nh-widget-title-row">
        <h3 className="nh-widget-title">{title}</h3>
        {titleExtra ? <span className="nh-widget-title-extra">{titleExtra}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default function ArgonRightbar({
  posts = [],
  tocItems = [],
  articleSidebar = null,
  deployedProjects = [],
}) {
  const categories = collectCategories(posts);
  const tags = collectTags(posts);
  const recentPosts = posts.slice(0, 6).map((post) => ({
    slug: post.slug,
    title: String(post?.frontmatter?.title ?? post.slug ?? ""),
  }));
  const onlineProjects = collectOnlineProjects(deployedProjects);
  const deployedProjectNames = onlineProjects.slice(0, 3).map((project) => project.name);
  const isArticleSidebar = Boolean(articleSidebar);
  const recentComments = articleSidebar?.recentComments ?? [];

  if (isArticleSidebar) {
    return (
      <div className="nh-rightbar-wrap" style={{ alignSelf: "stretch", height: "100%", minHeight: "100%" }}>
        <aside
          className="nh-rightbar nh-rightbar-desktop"
          aria-label="右侧信息栏"
          style={{ position: "relative", height: "100%", minHeight: "100%" }}
        >
          <WidgetFrame title="最近评论">
            <RightbarRecentComments recentComments={recentComments} />
          </WidgetFrame>

          {tocItems.length ? (
            <WidgetFrame title="文章目录" className="nh-widget-sticky-catalog">
              <RightbarArticleCatalog tocItems={tocItems} />
            </WidgetFrame>
          ) : null}
        </aside>
      </div>
    );
  }

  return (
    <div className="nh-rightbar-wrap" style={{ alignSelf: "stretch", height: "100%", minHeight: "100%" }}>
      <aside
        className="nh-rightbar nh-rightbar-desktop"
        aria-label="右侧信息栏"
        style={{ position: "relative", height: "100%", minHeight: "100%" }}
      >
        <RightbarProfileSettings
          postCount={posts.length}
          categoryCount={categories.length}
          tagCount={tags.length}
        />

        {onlineProjects.length ? (
          <WidgetFrame title="在线项目">
            <div className="nh-rightbar-online">
              <p className="nh-rightbar-online-count">
                <strong>{onlineProjects.length}</strong> 个项目已上线
              </p>
              {deployedProjectNames.length ? (
                <div className="nh-rightbar-online-tags">
                  {deployedProjectNames.map((name) => (
                    <span key={name} className="nh-chip">
                      {name}
                    </span>
                  ))}
                </div>
              ) : null}
              <Link href="/projects" className="nh-rightbar-online-entry">
                查看全部项目
              </Link>
            </div>
          </WidgetFrame>
        ) : null}

        <RightbarTrendingWidget />

        {tocItems.length ? (
          <WidgetFrame title="文章目录" className="nh-widget-sticky-catalog">
            <RightbarArticleCatalog tocItems={tocItems} />
          </WidgetFrame>
        ) : null}

        <WidgetFrame title="内容导航">
          <RightbarContentTabs categories={categories} tags={tags} recentPosts={recentPosts} />
        </WidgetFrame>
      </aside>
    </div>
  );
}
