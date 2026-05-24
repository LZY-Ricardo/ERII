"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function RightbarContentTabs({ categories = [], tags = [], recentPosts = [] }) {
  const [contentTab, setContentTab] = useState("recent");

  return (
    <>
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
                  <Link href={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
                </li>
              ))
            ) : (
              <li className="nh-muted">暂无文章</li>
            )}
          </ul>
        ) : null}
      </div>
    </>
  );
}
