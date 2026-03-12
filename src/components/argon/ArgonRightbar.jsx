"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

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

  const categoryOrder = ["TeamSpeak", "电脑技术", "直播", "游戏", "音乐", "影视", "未分类"];
  return categoryOrder
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

function WidgetFrame({ title, children }) {
  return (
    <section className="nh-widget nh-card">
      <h3 className="nh-widget-title">{title}</h3>
      {children}
    </section>
  );
}

export default function ArgonRightbar({ posts = [], tocItems = [] }) {
  const categories = useMemo(() => collectCategories(posts), [posts]);
  const tags = useMemo(() => collectTags(posts), [posts]);
  const recentPosts = useMemo(() => posts.slice(0, 6), [posts]);

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProjects(data.data ?? []);
      });
  }, []);

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

  const renderOverviewBody = () => (
    <div className="nh-profile">
      <p className="nh-profile-name">Ricardo</p>
      <p className="nh-profile-status">前端与 AI 学习记录</p>
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

  return (
    <div className="nh-rightbar-wrap">
      <aside className="nh-rightbar nh-rightbar-desktop" aria-label="右侧信息栏">
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

        {tocItems.length ? (
          <WidgetFrame title="文章目录">
            <ol className="nh-catalog-list">
              {tocItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ol>
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
