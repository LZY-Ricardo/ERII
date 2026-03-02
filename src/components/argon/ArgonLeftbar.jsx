"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

const PANEL_ITEMS = [
  { id: "search", label: "搜索" },
  { id: "overview", label: "站点" },
  { id: "catalog", label: "目录" },
  { id: "category", label: "分类" },
  { id: "tag", label: "标签" },
  { id: "tool", label: "设置" },
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
  const activeCategoryCount = useMemo(
    () => categories.filter((item) => item.count > 0).length,
    [categories]
  );
  const [avatarSrc, setAvatarSrc] = useState("/images/avatar-ricardo.jpg");

  const [darkMode, setDarkMode] = useState(false);
  const [serifMode, setSerifMode] = useState(true);
  const [deepShadow, setDeepShadow] = useState(false);
  const [filterMode, setFilterMode] = useState("none");
  const [radius, setRadius] = useState(30);
  const [themeColor, setThemeColor] = useState("#89232e");

  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");

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

    window.dispatchEvent(
      new CustomEvent("nh:appearance-state", {
        detail: { darkMode, serifMode, deepShadow, filterMode, radius, themeColor },
      })
    );

    return () => {
      body.classList.remove("nh-dark", "nh-font-serif", "nh-panel-open");
      delete body.dataset.nhFilter;
    };
  }, [darkMode, serifMode, deepShadow, filterMode, radius, themeColor, panelOpen]);

  useEffect(() => {
    const onSetAppearance = (event) => {
      const detail = event?.detail ?? {};

      if (Object.hasOwn(detail, "darkMode")) setDarkMode(Boolean(detail.darkMode));
      if (Object.hasOwn(detail, "serifMode")) setSerifMode(Boolean(detail.serifMode));
      if (Object.hasOwn(detail, "deepShadow")) setDeepShadow(Boolean(detail.deepShadow));
      if (Object.hasOwn(detail, "filterMode")) setFilterMode(String(detail.filterMode ?? "none"));
      if (Object.hasOwn(detail, "radius")) {
        const nextRadius = Number(detail.radius);
        if (Number.isFinite(nextRadius)) setRadius(nextRadius);
      }
      if (Object.hasOwn(detail, "themeColor")) setThemeColor(String(detail.themeColor ?? "#89232e"));
    };

    window.addEventListener("nh:set-appearance", onSetAppearance);
    return () => window.removeEventListener("nh:set-appearance", onSetAppearance);
  }, []);

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
      <input className="nh-search-input" placeholder="搜索文章 / 标签 / 关键词" aria-label="搜索" />
      <p className="nh-quote">输入关键词可快速定位文章内容。</p>
    </>
  );

  const renderIdentityCard = () => (
    <section className="nh-widget nh-card nh-profile-card" aria-label="站长信息">
      <div className="nh-profile-card-head">
        <div className="nh-profile-avatar">
          <Image
            src={avatarSrc}
            alt="Ricardo 头像"
            width={88}
            height={88}
            onError={() => setAvatarSrc("/sakura.png")}
          />
        </div>
        <p className="nh-profile-card-name">Ricardo</p>
        <p className="nh-profile-card-role">前端 · AI 技术探索者</p>
        <p className="nh-profile-card-status">持续更新中</p>
      </div>

      <p className="nh-profile-card-bio">这里主要分享前端开发与 AI 实践过程中的笔记、踩坑与项目复盘。</p>

      <div className="nh-profile-card-stats">
        <span>
          <strong>{posts.length}</strong>
          <small>文章</small>
        </span>
        <span>
          <strong>{activeCategoryCount}</strong>
          <small>分类</small>
        </span>
        <span>
          <strong>{tags.length}</strong>
          <small>标签</small>
        </span>
      </div>

      <div className="nh-profile-card-links">
        <Link href="/about" className="nh-profile-card-link">
          关于我
        </Link>
        <Link href="/blog?topic=tech" className="nh-profile-card-link">
          技术文章
        </Link>
        <a
          href="https://wpa.qq.com/msgrd?v=3&uin=3239468786&site=qq&menu=yes"
          target="_blank"
          rel="noreferrer"
          className="nh-profile-card-link"
        >
          QQ 3239468786
        </a>
        <a
          href="https://github.com/LZY-Ricardo"
          target="_blank"
          rel="noreferrer"
          className="nh-profile-card-link"
        >
          GitHub
        </a>
      </div>
    </section>
  );

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
        <span className="nh-muted">暂无标签</span>
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
        深色模式
      </label>

      <label>
        <input type="checkbox" checked={serifMode} onChange={(e) => setSerifMode(e.target.checked)} />
        衬线字体
      </label>

      <label>
        <input type="checkbox" checked={deepShadow} onChange={(e) => setDeepShadow(e.target.checked)} />
        阴影增强
      </label>

      <label>
        滤镜
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
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
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </label>

      <label>
        主题色
        <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
      </label>
    </div>
  );

  const panelRenderer = {
    search: () => <WidgetFrame title="站内搜索">{renderSearchBody()}</WidgetFrame>,
    overview: () => <WidgetFrame title="站点信息">{renderOverviewBody()}</WidgetFrame>,
    catalog: () => <WidgetFrame title="文章目录">{renderCatalogBody()}</WidgetFrame>,
    category: () => <WidgetFrame title="分类">{renderCategoriesBody()}</WidgetFrame>,
    tag: () => <WidgetFrame title="标签">{renderTagsBody()}</WidgetFrame>,
    tool: () => <WidgetFrame title="显示设置">{renderToolsBody()}</WidgetFrame>,
  };

  const renderActivePanel = panelRenderer[activePanel] ?? panelRenderer.overview;

  return (
    <div className="nh-leftbar-wrap">
      <aside className="nh-leftbar nh-leftbar-desktop" aria-label="左侧信息栏">
        <WidgetFrame title="站内搜索">{renderSearchBody()}</WidgetFrame>
        {renderIdentityCard()}
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
            {activePanel !== "search" ? <WidgetFrame title="最新文章">{renderRecentBody()}</WidgetFrame> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
