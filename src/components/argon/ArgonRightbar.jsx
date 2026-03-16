"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ArticleCatalogList from "@/src/components/argon/ArticleCatalogList";
import { useArticleCatalogNavigation } from "@/src/components/argon/useArticleCatalogNavigation";
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

function formatRecentCommentTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;

  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function normalizeCardTransparency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 25;
  return Math.min(65, Math.max(0, Math.round(numeric)));
}

function applyCardTransparencyPreview(value) {
  if (typeof document === "undefined") return;

  const safeTransparency = normalizeCardTransparency(value);
  const alpha = Number((1 - safeTransparency / 100).toFixed(3));
  const solidAlpha = Number((1 - (safeTransparency / 100) * 0.85).toFixed(3));
  const body = document.body;
  const darkMode = body.classList.contains("nh-dark");

  const bg = darkMode ? `rgba(38, 28, 31, ${alpha})` : `rgba(255, 249, 242, ${alpha})`;
  const solid = darkMode ? `rgba(44, 30, 34, ${solidAlpha})` : `rgba(255, 250, 245, ${solidAlpha})`;

  body.style.setProperty("--nh-card-transparency", `${safeTransparency}`);
  body.style.setProperty("--nh-card-bg", bg);
  body.style.setProperty("--nh-card-bg-solid", solid);
}

function collectCategories(posts) {
  const counts = new Map();

  for (const post of posts) {
    const key = inferCategoryFromPost(post);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return POST_CATEGORY_DISPLAY_ORDER
    .map((label) => ({
      label,
      count: counts.get(label) ?? 0,
      displayLabel: getCategoryThemeLabel(label),
    }))
    .filter((item) => item.count > 0);
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

function Tabs({ value, onChange, items }) {
  return (
    <div className="nh-tabs nh-tabs-switch" role="tablist" aria-label="切换选项">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nh-tab-btn ${value === item.id ? "is-active" : ""}`}
          onClick={() => onChange(item.id)}
          role="tab"
          aria-selected={value === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function WidgetFrame({ title, children, className = "" }) {
  return (
    <section className={`nh-widget nh-card ${className}`.trim()}>
      <h3 className="nh-widget-title">{title}</h3>
      {children}
    </section>
  );
}

export default function ArgonRightbar({ posts = [], tocItems = [], articleSidebar = null }) {
  const categories = useMemo(() => collectCategories(posts), [posts]);
  const tags = useMemo(() => collectTags(posts), [posts]);
  const recentPosts = useMemo(() => posts.slice(0, 6), [posts]);
  const {
    catalogItems,
    visibleItems,
    activeHeadingId,
    expandedParentId,
    shouldCollapseNested,
    jumpToHeading,
  } = useArticleCatalogNavigation(tocItems);
  const isArticleSidebar = Boolean(articleSidebar);
  const recentComments = articleSidebar?.recentComments ?? [];

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (isArticleSidebar) return undefined;

    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProjects(data.data ?? []);
      });
  }, [isArticleSidebar]);

  const deployedProjects = useMemo(() => {
    return projects
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
  }, [projects]);

  const deployedProjectNames = useMemo(
    () => deployedProjects.slice(0, 3).map((project) => project.name),
    [deployedProjects]
  );

  const [switcherTab, setSwitcherTab] = useState("overview");
  const [contentTab, setContentTab] = useState("recent");
  const [darkMode, setDarkMode] = useState(false);
  const [serifMode, setSerifMode] = useState(true);
  const [deepShadow, setDeepShadow] = useState(false);
  const [filterMode, setFilterMode] = useState("none");
  const [radius, setRadius] = useState(30);
  const [themeColor, setThemeColor] = useState("#89232e");
  const [cardTransparency, setCardTransparency] = useState(25);

  const emitAppearance = (patch) => {
    window.dispatchEvent(new CustomEvent("nh:set-appearance", { detail: patch }));
  };

  useEffect(() => {
    const onAppearanceState = (event) => {
      const detail = event?.detail ?? {};
      setDarkMode(Boolean(detail.darkMode));
      setSerifMode(Boolean(detail.serifMode));
      setDeepShadow(Boolean(detail.deepShadow));
      setFilterMode(String(detail.filterMode ?? "none"));
      setRadius(Number(detail.radius ?? 30));
      setThemeColor(String(detail.themeColor ?? "#89232e"));
      if (Object.hasOwn(detail, "cardTransparency")) {
        setCardTransparency(normalizeCardTransparency(detail.cardTransparency));
      } else if (Object.hasOwn(detail, "cardOpacity")) {
        setCardTransparency(normalizeCardTransparency(100 - Number(detail.cardOpacity)));
      } else {
        setCardTransparency(25);
      }
    };

    window.addEventListener("nh:appearance-state", onAppearanceState);
    return () => window.removeEventListener("nh:appearance-state", onAppearanceState);
  }, []);

  useEffect(() => {
    applyCardTransparencyPreview(cardTransparency);
  }, [cardTransparency, darkMode]);

  const jumpToComment = (commentId) => (event) => {
    if (!commentId || typeof window === "undefined") return;

    const targetId = `comment-${commentId}`;
    event.preventDefault();
    window.history.pushState(null, "", `#${targetId}`);

    const scrollToComment = (attempt = 0) => {
      const commentTarget = document.getElementById(targetId);
      if (commentTarget) {
        commentTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempt === 0) {
        const commentsSection = document.getElementById("comments");
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      if (attempt < 10) {
        window.setTimeout(() => scrollToComment(attempt + 1), 180);
      }
    };

    scrollToComment();
  };

  const jumpToElement = (targetId, hash = targetId) => (event) => {
    if (!targetId || typeof window === "undefined") return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, "", `#${hash}`);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderOverviewBody = () => (
    <div className="nh-profile">
      <p className="nh-profile-name">Ricardo</p>
      <p className="nh-profile-status">前端、AI 与开发学习记录</p>
      <div className="nh-profile-stats">
        <span>{posts.length} 篇文章</span>
        <span>{categories.length} 个分类</span>
        <span>{tags.length} 个标签</span>
      </div>
    </div>
  );

  const renderToolsBody = () => (
    <div className="nh-controls">
      <label className="nh-control-check">
        <span>深色模式</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(e) => {
            const checked = e.target.checked;
            setDarkMode(checked);
            emitAppearance({ darkMode: checked });
          }}
        />
      </label>

      <label className="nh-control-check">
        <span>衬线字体</span>
        <input
          type="checkbox"
          checked={serifMode}
          onChange={(e) => {
            const checked = e.target.checked;
            setSerifMode(checked);
            emitAppearance({ serifMode: checked });
          }}
        />
      </label>

      <label className="nh-control-check">
        <span>阴影增强</span>
        <input
          type="checkbox"
          checked={deepShadow}
          onChange={(e) => {
            const checked = e.target.checked;
            setDeepShadow(checked);
            emitAppearance({ deepShadow: checked });
          }}
        />
      </label>

      <label>
        滤镜
        <select
          value={filterMode}
          onChange={(e) => {
            const next = e.target.value;
            setFilterMode(next);
            emitAppearance({ filterMode: next });
          }}
        >
          <option value="none">关闭</option>
          <option value="sunset">暖色</option>
          <option value="dim">暗化</option>
          <option value="gray">灰度</option>
        </select>
      </label>

      <label>
        圆角 {radius}px
        <input
          type="range"
          min="8"
          max="36"
          step="1"
          value={radius}
          onChange={(e) => {
            const next = Number(e.target.value);
            setRadius(next);
            emitAppearance({ radius: next });
          }}
        />
      </label>

      <label>
        主题色
        <input
          type="color"
          value={themeColor}
          onChange={(e) => {
            const next = e.target.value;
            setThemeColor(next);
            emitAppearance({ themeColor: next });
          }}
        />
      </label>

      <label>
        卡片透明度 {cardTransparency}%
        <input
          type="range"
          min="0"
          max="65"
          step="1"
          value={cardTransparency}
          onChange={(e) => {
            const next = normalizeCardTransparency(e.target.value);
            setCardTransparency(next);
            applyCardTransparencyPreview(next);
            emitAppearance({ cardTransparency: next });
          }}
        />
      </label>
    </div>
  );

  const renderArticleCommentsBody = () =>
    recentComments.length ? (
      <div className="nh-recent-comments-block">
        <ul className="nh-recent-comments-list">
          {recentComments.map((comment) => (
            <li key={comment.id} className="nh-recent-comments-item">
              <a
                href={`#comment-${comment.id}`}
                className="nh-recent-comment-link"
                onClick={jumpToComment(comment.id)}
              >
                <div className="nh-recent-comment-head">
                  <div className="nh-recent-comment-meta">
                    <span className="nh-recent-comment-author">{comment.authorName}</span>
                    {comment.isPrivate ? (
                      <span className="nh-recent-comment-badge">私密</span>
                    ) : null}
                  </div>
                  <time className="nh-recent-comment-time">{formatRecentCommentTime(comment.createdAt)}</time>
                </div>
                <p className="nh-recent-comment-preview" style={{ WebkitLineClamp: 2 }}>
                  {comment.contentPreview}
                </p>
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#comments"
          className="nh-recent-comments-action"
          onClick={jumpToElement("comments")}
        >
          去评论区
        </a>
      </div>
    ) : (
      <div className="nh-recent-comments-empty">
        <p className="nh-muted">还没有评论，来抢个沙发吧。</p>
        <a
          href="#post_comment"
          className="nh-recent-comments-action"
          onClick={jumpToElement("post_comment")}
        >
          去评论
        </a>
      </div>
    );

  if (isArticleSidebar) {
    return (
      <div className="nh-rightbar-wrap" style={{ alignSelf: "stretch", height: "100%", minHeight: "100%" }}>
        <aside
          className="nh-rightbar nh-rightbar-desktop"
          aria-label="右侧信息栏"
          style={{ position: "relative", height: "100%", minHeight: "100%" }}
        >
          <WidgetFrame title="最近评论">{renderArticleCommentsBody()}</WidgetFrame>

          {catalogItems.length ? (
            <WidgetFrame title="文章目录" className="nh-widget-sticky-catalog">
              <ArticleCatalogList
                items={visibleItems}
                activeHeadingId={activeHeadingId}
                expandedParentId={expandedParentId}
                shouldCollapseNested={shouldCollapseNested}
                createJumpHandler={jumpToHeading}
              />
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
        <section className="nh-widget nh-card">
          <Tabs
            value={switcherTab}
            onChange={setSwitcherTab}
            items={[
              { id: "overview", label: "站点" },
              { id: "tool", label: "设置" },
            ]}
          />
          <div className="nh-switcher-body">
            {switcherTab === "tool" ? renderToolsBody() : renderOverviewBody()}
          </div>
        </section>

        <WidgetFrame title="在线项目">
          <div className="nh-rightbar-online">
            {deployedProjects.length ? (
              <>
                <p className="nh-rightbar-online-count">
                  <strong>{deployedProjects.length}</strong> 个项目已上线
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
              </>
            ) : (
              <p className="nh-muted">暂无已部署项目</p>
            )}
          </div>
        </WidgetFrame>

        {catalogItems.length ? (
          <WidgetFrame title="文章目录" className="nh-widget-sticky-catalog">
            <ArticleCatalogList
              items={visibleItems}
              activeHeadingId={activeHeadingId}
              expandedParentId={expandedParentId}
              shouldCollapseNested={shouldCollapseNested}
              createJumpHandler={jumpToHeading}
            />
          </WidgetFrame>
        ) : null}

        <WidgetFrame title="内容导航">
          <Tabs
            value={contentTab}
            onChange={setContentTab}
            items={[
              { id: "recent", label: "最新" },
              { id: "category", label: "分类" },
              { id: "tag", label: "标签" },
            ]}
          />
          <div className="nh-switcher-body">
            {contentTab === "category" ? (
              <div className="nh-chip-wrap">
                {categories.length ? (
                  categories.map((category) => (
                    <Link
                      key={category.label}
                      href={`/blog?category=${encodeURIComponent(category.label)}`}
                      className="nh-chip"
                    >
                      {category.displayLabel} {category.count}
                    </Link>
                  ))
                ) : (
                  <span className="nh-muted">暂无分类</span>
                )}
              </div>
            ) : null}

            {contentTab === "tag" ? (
              <div className="nh-chip-wrap">
                {tags.length ? (
                  tags.map((tag) => (
                    <Link key={tag.label} href={`/blog?tag=${encodeURIComponent(tag.label)}`} className="nh-chip">
                      {tag.label} {tag.count}
                    </Link>
                  ))
                ) : (
                  <span className="nh-muted">暂无标签</span>
                )}
              </div>
            ) : null}

            {contentTab === "recent" ? (
              <ul className="nh-recent-list">
                {recentPosts.length ? (
                  recentPosts.map((post) => (
                    <li key={post.slug}>
                      <Link href={`/blog/${encodeURIComponent(post.slug)}`}>{post.frontmatter.title}</Link>
                    </li>
                  ))
                ) : (
                  <li className="nh-muted">暂无文章</li>
                )}
              </ul>
            ) : null}
          </div>
        </WidgetFrame>
      </aside>
    </div>
  );
}
