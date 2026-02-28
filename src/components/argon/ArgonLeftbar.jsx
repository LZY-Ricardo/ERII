"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

const PANEL_ITEMS = [
  { id: "search", label: "索引" },
  { id: "overview", label: "概览" },
  { id: "catalog", label: "目录" },
  { id: "category", label: "谱系" },
  { id: "tag", label: "印记" },
  { id: "tool", label: "调律" },
];

function collectCategories(posts) {
  const counts = new Map();
  for (const post of posts) {
    const key = inferCategoryFromPost(post);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const categoryOrder = ["TeamSpeak", "电脑技巧", "直播", "游戏", "音乐", "影视", "未分类"];
  return categoryOrder.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
    displayLabel: getCategoryThemeLabel(label),
  }));
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
    .slice(0, 12)
    .map(([label, count]) => ({ label, count }));
}

function hexToRgb(hex) {
  const raw = String(hex ?? "")
    .trim()
    .replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "137,35,46";
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `${r},${g},${b}`;
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

export default function ArgonLeftbar({ posts = [], tocItems = [] }) {
  const categories = useMemo(() => collectCategories(posts), [posts]);
  const tags = useMemo(() => collectTags(posts), [posts]);
  const recentPosts = useMemo(() => posts.slice(0, 5), [posts]);

  const [darkMode, setDarkMode] = useState(false);
  const [serifMode, setSerifMode] = useState(true);
  const [deepShadow, setDeepShadow] = useState(false);
  const [filterMode, setFilterMode] = useState("none");
  const [radius, setRadius] = useState(30);
  const [themeColor, setThemeColor] = useState("#89232e");

  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");
  const [switcherTab, setSwitcherTab] = useState(tocItems.length ? "catalog" : "overview");
  const activeSwitcherTab =
    switcherTab === "catalog" && !tocItems.length ? "overview" : switcherTab;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty("--nh-theme", themeColor);
    root.style.setProperty("--nh-theme-rgb", hexToRgb(themeColor));
    root.style.setProperty("--nh-radius", `${radius}px`);
    root.style.setProperty(
      "--nh-shadow",
      deepShadow
        ? "0 18px 40px rgba(30, 20, 24, 0.28), 0 8px 22px rgba(20, 12, 16, 0.28)"
        : "0 15px 35px rgba(60, 30, 34, 0.14), 0 5px 15px rgba(34, 18, 20, 0.1)"
    );

    body.classList.toggle("nh-dark", darkMode);
    body.classList.toggle("nh-font-serif", serifMode);
    body.dataset.nhFilter = filterMode;
    body.classList.toggle("nh-panel-open", panelOpen);

    return () => {
      body.classList.remove("nh-dark", "nh-font-serif", "nh-panel-open");
      delete body.dataset.nhFilter;
    };
  }, [darkMode, serifMode, deepShadow, filterMode, radius, themeColor, panelOpen]);

  useEffect(() => {
    const closeOnEsc = (event) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, []);

  useEffect(() => {
    const openFromNavbar = (event) => {
      const panelId = String(event?.detail?.panelId ?? "search");
      const exists = PANEL_ITEMS.some((item) => item.id === panelId);
      setActivePanel(exists ? panelId : "search");
      setPanelOpen(true);
    };

    window.addEventListener("nh:open-panel", openFromNavbar);
    return () => window.removeEventListener("nh:open-panel", openFromNavbar);
  }, []);

  const openPanel = (panelId) => {
    if (panelOpen && activePanel === panelId) {
      setPanelOpen(false);
      return;
    }
    setActivePanel(panelId);
    setPanelOpen(true);
  };

  const renderSearchBody = () => (
    <>
      <input className="nh-search-input" placeholder="搜索章节 / 角色 / 城市" aria-label="搜索" />
      <p className="nh-quote">每日一言 任何命运的馈赠，早已在暗中标好了价格。</p>
    </>
  );

  const renderOverviewBody = () => (
    <div className="nh-profile">
      <p className="nh-profile-name">ERII · 档案员</p>
      <p className="nh-profile-status">卡塞尔值班中</p>
      <div className="nh-profile-stats">
        <span>{posts.length} 份记录</span>
        <span>{categories.length} 条谱系</span>
        <span>{tags.length} 枚印记</span>
      </div>
    </div>
  );

  const renderCatalogBody = () =>
    tocItems.length ? (
      <ol className="nh-catalog-list">
        {tocItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ol>
    ) : (
      <p className="nh-muted">当前页面暂无章节目录。</p>
    );

  const renderCategoriesBody = () => (
    <div className="nh-chip-wrap">
      {categories.map((category) => (
        <Link
          key={category.label}
          href={`/blog?category=${encodeURIComponent(category.label)}`}
          className="nh-chip"
        >
          {category.displayLabel} {category.count}
        </Link>
      ))}
    </div>
  );

  const renderTagsBody = () => (
    <div className="nh-chip-wrap">
      {tags.length ? (
        tags.map((tag) => (
          <Link key={tag.label} href={`/blog?tag=${encodeURIComponent(tag.label)}`} className="nh-chip">
            {tag.label} {tag.count}
          </Link>
        ))
      ) : (
        <span className="nh-muted">暂无印记</span>
      )}
    </div>
  );

  const renderRecentBody = () => (
    <ul className="nh-recent-list">
      {recentPosts.map((post) => (
        <li key={post.slug}>
          <Link href={`/blog/${encodeURIComponent(post.slug)}`}>{post.frontmatter.title}</Link>
        </li>
      ))}
    </ul>
  );

  const renderToolsBody = () => (
    <div className="nh-controls">
      <label>
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        夜幕模式
      </label>

      <label>
        <input type="checkbox" checked={serifMode} onChange={(e) => setSerifMode(e.target.checked)} />
        古典 Serif
      </label>

      <label>
        <input type="checkbox" checked={deepShadow} onChange={(e) => setDeepShadow(e.target.checked)} />
        深渊阴影
      </label>

      <label>
        滤镜
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
          <option value="none">关闭</option>
          <option value="sunset">夕照</option>
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
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </label>

      <label>
        主色
        <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
      </label>
    </div>
  );

  const renderSwitcherBody = () => {
    if (activeSwitcherTab === "catalog") return renderCatalogBody();
    if (activeSwitcherTab === "tool") return renderToolsBody();
    return renderOverviewBody();
  };

  const panelRenderer = {
    search: () => <WidgetFrame title="索引检索">{renderSearchBody()}</WidgetFrame>,
    overview: () => <WidgetFrame title="学院概览">{renderOverviewBody()}</WidgetFrame>,
    catalog: () => <WidgetFrame title="章节目录">{renderCatalogBody()}</WidgetFrame>,
    category: () => <WidgetFrame title="谱系">{renderCategoriesBody()}</WidgetFrame>,
    tag: () => <WidgetFrame title="印记">{renderTagsBody()}</WidgetFrame>,
    tool: () => <WidgetFrame title="炼金调律">{renderToolsBody()}</WidgetFrame>,
  };

  const renderActivePanel = panelRenderer[activePanel] ?? panelRenderer.overview;

  return (
    <div className="nh-leftbar-wrap">
      <aside className="nh-leftbar nh-leftbar-desktop" aria-label="侧边功能栏">
        <WidgetFrame title="索引检索">{renderSearchBody()}</WidgetFrame>

        <section className="nh-widget nh-card">
          <Tabs
            value={activeSwitcherTab}
            onChange={setSwitcherTab}
            items={[
              { id: "catalog", label: "章节目录" },
              { id: "overview", label: "学院概览" },
              { id: "tool", label: "调律" },
            ]}
          />
          <div className="nh-switcher-body">{renderSwitcherBody()}</div>
        </section>

        <WidgetFrame title="谱系">{renderCategoriesBody()}</WidgetFrame>
        <WidgetFrame title="印记">{renderTagsBody()}</WidgetFrame>
        <WidgetFrame title="最新记录">{renderRecentBody()}</WidgetFrame>
      </aside>

      <div className="nh-leftbar-float" aria-label="浮动面板">
        <div className="nh-fab-tabs" role="tablist" aria-label="浮动功能">
          {PANEL_ITEMS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              className={`nh-fab-tab ${panelOpen && activePanel === panel.id ? "is-active" : ""}`}
              onClick={() => openPanel(panel.id)}
              aria-pressed={panelOpen && activePanel === panel.id}
            >
              {panel.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`nh-float-backdrop ${panelOpen ? "is-open" : ""}`}
          onClick={() => setPanelOpen(false)}
          aria-label="关闭面板"
        />

        <section className={`nh-float-panel ${panelOpen ? "is-open" : ""}`} aria-live="polite">
          <header className="nh-float-panel-head">
            <h3>{PANEL_ITEMS.find((item) => item.id === activePanel)?.label ?? "面板"}</h3>
            <button type="button" onClick={() => setPanelOpen(false)} aria-label="关闭">
              ×
            </button>
          </header>

          <div className="nh-float-panel-body">
            {renderActivePanel()}
            {activePanel !== "search" ? <WidgetFrame title="最新记录">{renderRecentBody()}</WidgetFrame> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
