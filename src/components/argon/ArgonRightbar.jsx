"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategoryThemeLabel, inferCategoryFromPost } from "@/src/lib/postTaxonomy";

function collectCategories(posts) {
  const counts = new Map();
  for (const post of posts) {
    const key = inferCategoryFromPost(post);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const categoryOrder = ["TeamSpeak", "电脑技巧", "直播", "游戏", "音乐", "影视", "未分类"];
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

  const [switcherTab, setSwitcherTab] = useState("overview");
  const [contentTab, setContentTab] = useState("recent");
  const [darkMode, setDarkMode] = useState(false);
  const [serifMode, setSerifMode] = useState(true);
  const [deepShadow, setDeepShadow] = useState(false);
  const [filterMode, setFilterMode] = useState("none");
  const [radius, setRadius] = useState(30);
  const [themeColor, setThemeColor] = useState("#89232e");

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
    };

    window.addEventListener("nh:appearance-state", onAppearanceState);
    return () => window.removeEventListener("nh:appearance-state", onAppearanceState);
  }, []);

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
      <label>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(e) => {
            const checked = e.target.checked;
            setDarkMode(checked);
            emitAppearance({ darkMode: checked });
          }}
        />
        深色模式
      </label>

      <label>
        <input
          type="checkbox"
          checked={serifMode}
          onChange={(e) => {
            const checked = e.target.checked;
            setSerifMode(checked);
            emitAppearance({ serifMode: checked });
          }}
        />
        衬线字体
      </label>

      <label>
        <input
          type="checkbox"
          checked={deepShadow}
          onChange={(e) => {
            const checked = e.target.checked;
            setDeepShadow(checked);
            emitAppearance({ deepShadow: checked });
          }}
        />
        阴影增强
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
