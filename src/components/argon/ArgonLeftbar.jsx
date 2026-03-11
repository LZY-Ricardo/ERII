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

const DAILY_LONGZU_QUOTES = [
  { text: "命运这种东西，生来就是要被踏于足下的。", source: "《龙族》" },
  { text: "所谓弃族的命运，就是要穿越荒原，再次竖起战旗，返回故乡。", source: "《龙族》" },
  { text: "有些时间点错过一次，就好比错过了一生。", source: "《龙族》" },
  { text: "如果喜欢谁，就满世界去找她，别等她来找你。", source: "《龙族》" },
  { text: "真正的勇气，不是没有恐惧，而是带着恐惧仍然向前。", source: "《龙族》" },
  { text: "人总要为自己相信的东西，付出一点代价。", source: "《龙族》" },
  { text: "总有些路必须一个人走，总有些夜要自己熬过去。", source: "《龙族》" },
  { text: "你可以退后一步，但别把后背交给命运。", source: "《龙族》" },
  { text: "成长就是把哭声调成静音，然后继续向前。", source: "《龙族》" },
  { text: "世界上没有真正的感同身受，但可以并肩而行。", source: "《龙族》" },
  { text: "当黑暗降临时，记得你也曾是别人的光。", source: "《龙族》" },
  { text: "愿你出走半生，归来仍有少年之心。", source: "《龙族》" },
];

function getDailyLongzuQuote(now = new Date()) {
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - yearStart) / 86400000);
  const index = (dayOfYear - 1 + DAILY_LONGZU_QUOTES.length) % DAILY_LONGZU_QUOTES.length;
  return DAILY_LONGZU_QUOTES[index];
}

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

function normalizeCardTransparency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 25;
  return Math.min(65, Math.max(0, Math.round(numeric)));
}

function buildCardBackground(transparency, darkMode) {
  const safeTransparency = normalizeCardTransparency(transparency);
  const alpha = Number((1 - safeTransparency / 100).toFixed(3));
  const solidAlpha = Number((1 - (safeTransparency / 100) * 0.85).toFixed(3));

  if (darkMode) {
    return {
      bg: `rgba(38, 28, 31, ${alpha})`,
      solid: `rgba(44, 30, 34, ${solidAlpha})`,
    };
  }

  return {
    bg: `rgba(255, 249, 242, ${alpha})`,
    solid: `rgba(255, 250, 245, ${solidAlpha})`,
  };
}

function WidgetFrame({ title, children, className = "" }) {
  return (
    <section className={`nh-widget nh-card ${className}`.trim()}>
      <h3 className="nh-widget-title">{title}</h3>
      {children}
    </section>
  );
}

export default function ArgonLeftbar({ posts = [], tocItems = [] }) {
  const categories = useMemo(() => collectCategories(posts), [posts]);
  const tags = useMemo(() => collectTags(posts), [posts]);
  const recentPosts = useMemo(() => posts.slice(0, 5), [posts]);
  const dailyQuote = useMemo(() => {
    const now = new Date();
    const quote = getDailyLongzuQuote(now);
    const dateText = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(now);
    return { quote, dateText };
  }, []);
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
  const [cardTransparency, setCardTransparency] = useState(25);

  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("overview");

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty("--nh-theme", themeColor);
    root.style.setProperty("--nh-theme-rgb", hexToRgb(themeColor));
    root.style.setProperty("--nh-radius", `${radius}px`);
    const safeTransparency = normalizeCardTransparency(cardTransparency);
    const cardBackground = buildCardBackground(safeTransparency, darkMode);
    root.style.setProperty("--nh-card-transparency", `${safeTransparency}`);
    body.style.setProperty("--nh-card-transparency", `${safeTransparency}`);
    body.style.setProperty("--nh-card-bg", cardBackground.bg);
    body.style.setProperty("--nh-card-bg-solid", cardBackground.solid);
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
        detail: { darkMode, serifMode, deepShadow, filterMode, radius, themeColor, cardTransparency },
      })
    );

    return () => {
      body.classList.remove("nh-dark", "nh-font-serif", "nh-panel-open");
      delete body.dataset.nhFilter;
      body.style.removeProperty("--nh-card-bg");
      body.style.removeProperty("--nh-card-bg-solid");
      body.style.removeProperty("--nh-card-transparency");
    };
  }, [darkMode, serifMode, deepShadow, filterMode, radius, themeColor, cardTransparency, panelOpen]);

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
      if (Object.hasOwn(detail, "cardTransparency")) {
        setCardTransparency(normalizeCardTransparency(detail.cardTransparency));
      } else if (Object.hasOwn(detail, "cardOpacity")) {
        setCardTransparency(normalizeCardTransparency(100 - Number(detail.cardOpacity)));
      }
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

  const renderDailyQuoteBody = () => (
    <div className="nh-daily-quote">
      <div className="nh-daily-quote-head">
        <span className="nh-daily-quote-kicker">LONGZU QUOTE</span>
        <time className="nh-daily-quote-date">{dailyQuote.dateText}</time>
      </div>
      <blockquote className="nh-daily-quote-text">“{dailyQuote.quote.text}”</blockquote>
      <p className="nh-daily-quote-meta">{dailyQuote.quote.source}</p>
    </div>
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
          技术分享
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
      <label className="nh-control-check">
        <span>深色模式</span>
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
      </label>

      <label className="nh-control-check">
        <span>衬线字体</span>
        <input type="checkbox" checked={serifMode} onChange={(e) => setSerifMode(e.target.checked)} />
      </label>

      <label className="nh-control-check">
        <span>阴影增强</span>
        <input type="checkbox" checked={deepShadow} onChange={(e) => setDeepShadow(e.target.checked)} />
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

      <label>
        卡片透明度 {cardTransparency}%
        <input
          type="range"
          min="0"
          max="65"
          step="1"
          value={cardTransparency}
          onChange={(e) => setCardTransparency(normalizeCardTransparency(e.target.value))}
        />
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
        <WidgetFrame title="每日一言" className="nh-daily-quote-card">
          {renderDailyQuoteBody()}
        </WidgetFrame>
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
